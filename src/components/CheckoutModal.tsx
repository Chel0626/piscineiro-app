'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientStock } from '@/hooks/useClientStock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ChevronDown, ChevronRight, ClipboardList, CheckCircle, MessageCircle, Settings } from 'lucide-react';

interface CheckoutModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback para quando finalizar com sucesso
}

export function CheckoutModal({ clientId, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { client, isLoading } = useClientDetails(clientId);
  const { stock, updateStock, deductProductByName } = useClientStock(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [visitData, setVisitData] = useState<VisitFormData | null>(null);
  const [mechanicalChecks, setMechanicalChecks] = useState({
    drainOpen: false,
    returnOpen: false,
    filterValve: false,
    drainClosed: false,
    timerAutomatic: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateMechanicalCheck = (check: keyof typeof mechanicalChecks) => {
    setMechanicalChecks(prev => ({
      ...prev,
      [check]: !prev[check]
    }));
  };

  const handleVisitSubmit = async (data: VisitFormData, structuredProducts?: any[]) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      
      // Atualizar estoque com produtos utilizados
      if (structuredProducts && structuredProducts.length > 0) {
        for (const product of structuredProducts) {
          await deductProductByName(product.name, product.quantity, product.unit);
        }
      }
      
      // Marcar cliente como finalizado no dia de hoje
      const clientRef = doc(db, 'clients', clientId);
      const today = new Date().toISOString().split('T')[0];
      await updateDoc(clientRef, {
        lastVisitDate: today,
        visitStatus: 'completed'
      });
      
      setVisitData(data);
      toast.success('Check-out realizado com sucesso!');
      
      // Notificar componente pai do sucesso
      if (onSuccess) {
        onSuccess();
      }
      
      // Fechar modal após sucesso
      setTimeout(() => {
        // Enviar WhatsApp automaticamente se configurado
        handleSendWhatsApp(data);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível realizar o check-out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async (data?: VisitFormData) => {
    if (!client || (!visitData && !data)) return;
    
    const currentData = data || visitData;
    if (!currentData) return;

    let message = `🏊‍♂️ *Relatório de Visita - ${client.name}*\n\n`;
    message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    message += `📍 Endereço: ${client.address}\n\n`;

    // Parâmetros da água
    const params = [];
    if (currentData.ph) params.push(`pH: ${currentData.ph}`);
    if (currentData.cloro) params.push(`Cloro: ${currentData.cloro} ppm`);
    if (currentData.alcalinidade) params.push(`Alcalinidade: ${currentData.alcalinidade} ppm`);
    if (params.length > 0) {
      message += `💧 *Parâmetros:* ${params.join(' | ')}\n`;
    }

    // Condição da água
    if (currentData.waterCondition) {
      message += `🌊 *Condição da Água:* ${currentData.waterCondition}\n`;
    }

    // Produtos utilizados
    if (currentData.productsUsed && currentData.productsUsed.trim()) {
      message += `\n📦 *Produtos Utilizados:*\n${currentData.productsUsed}\n`;
    }

    // Conferência Mecânica/Hidráulica
    const mechanicalStatus = Object.values(mechanicalChecks).filter(Boolean).length;
    if (mechanicalStatus > 0) {
      message += `\n🔧 *Conferência Hidráulica (${mechanicalStatus}/5):*\n`;
      const mechanicalItems = [
        { key: 'drainOpen', label: 'Ralo aberto' },
        { key: 'returnOpen', label: 'Retorno aberto' },
        { key: 'filterValve', label: 'Válvula no filtrar' },
        { key: 'drainClosed', label: 'Esgoto fechado' },
        { key: 'timerAutomatic', label: 'Timer no automático' },
      ];
      mechanicalItems.forEach(item => {
        const status = mechanicalChecks[item.key as keyof typeof mechanicalChecks] ? '✅' : '❌';
        message += `${status} ${item.label}\n`;
      });
    }

    // Horário de saída
    if (currentData.departureTime) {
      message += `\n⏰ *Horário de Saída:* ${currentData.departureTime}\n`;
    }

    // Observações
    if (currentData.description && currentData.description.trim()) {
      message += `\n📋 *Observações:* ${currentData.description}\n`;
    }

    // Foto
    if (currentData.poolPhoto) {
      // Se for base64, fazemos upload para o Storage temporário
      if (currentData.poolPhoto.startsWith('data:image')) {
        try {
          toast.info('Enviando foto para a nuvem...');
          // Nome único para o arquivo
          const fileName = `temp_reports/${Date.now()}_${client.id}.jpg`;
          const storageRef = ref(storage, fileName);
          
          // Upload da string base64
          await uploadString(storageRef, currentData.poolPhoto, 'data_url');
          
          // Obter URL pública
          const photoUrl = await getDownloadURL(storageRef);
          
          message += `\n📸 *Foto:* ${photoUrl}\n`;
          message += `_(Link válido por 24 horas)_`;
        } catch (error) {
          console.error('Erro upload:', error);
          message += `\n📸 *Foto:* (Erro ao gerar link, envie manualmente)\n`;
        }
      } else {
        message += `\n📸 *Foto da Piscina:* ${currentData.poolPhoto}\n`;
      }
    }

    message += `\n\n✅ *Visita concluída com sucesso!*`;
    message += `\n\n🏊 _Relatório enviado automaticamente via Piscineiro Mestre APP_`;

    const phoneNumber = client.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Número de telefone não encontrado');
    }
  };

  const handleClose = () => {
    setVisitData(null);
    setOpenSections({});
    setMechanicalChecks({
      drainOpen: false,
      returnOpen: false,
      filterValve: false,
      drainClosed: false,
      timerAutomatic: false,
    });
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
            <DialogDescription>Aguarde enquanto carregamos os dados.</DialogDescription>
          </DialogHeader>
          <div className="p-6">Carregando dados do cliente...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!client) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cliente não encontrado</DialogTitle>
            <DialogDescription>O cliente solicitado não foi encontrado.</DialogDescription>
          </DialogHeader>
          <div className="p-6">Não foi possível carregar os dados do cliente.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
            Check-out - {client.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {client.address} • {client.neighborhood}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-1">
          {/* Seção 1: Registrar Nova Visita */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('visit')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Registrar Nova Visita
                </div>
                {openSections.visit ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.visit && (
              <CardContent>
                <VisitForm
                  onSubmit={handleVisitSubmit}
                  isLoading={isSubmitting}
                  clientId={clientId}
                />
              </CardContent>
            )}
          </Card>

          {/* Seção 2: Checkout Hidráulico */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('mechanical')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Checkout Hidráulico
                </div>
                {openSections.mechanical ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.mechanical && (
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Marque os itens conforme a conferência mecânica:
                  </p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mechanicalChecks.drainOpen}
                        onChange={() => updateMechanicalCheck('drainOpen')}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Ralo aberto?</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mechanicalChecks.returnOpen}
                        onChange={() => updateMechanicalCheck('returnOpen')}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Retorno aberto?</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mechanicalChecks.filterValve}
                        onChange={() => updateMechanicalCheck('filterValve')}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Válvula no filtrar?</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mechanicalChecks.drainClosed}
                        onChange={() => updateMechanicalCheck('drainClosed')}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Esgoto fechado?</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mechanicalChecks.timerAutomatic}
                        onChange={() => updateMechanicalCheck('timerAutomatic')}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">Timer no automático?</span>
                    </label>
                  </div>
                  
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      <strong>Checados:</strong> {Object.values(mechanicalChecks).filter(Boolean).length}/5 itens
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ações de Finalização */}
          {visitData && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
                  <CheckCircle className="h-5 w-5" />
                  Check-out Concluído
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Visita registrada com sucesso! Você pode enviar o relatório para o cliente.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleSendWhatsApp()}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar Relatório via WhatsApp
                  </Button>
                  <Button 
                    onClick={handleClose}
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}