'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientStock } from '@/hooks/useClientStock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ChevronDown, ChevronRight, ClipboardList, CheckCircle, MessageCircle } from 'lucide-react';

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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ visit: true });
  const [visitData, setVisitData] = useState<VisitFormData | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
    if (currentData.ph) params.push(`pH: ${currentData.ph} (Ideal: 7,2 - 7,6)`);
    if (currentData.cloro) params.push(`Cloro: ${currentData.cloro} ppm (Ideal: 1 - 3 ppm`);
    if (currentData.alcalinidade) params.push(`Alcalinidade: ${currentData.alcalinidade} ppm (Ideal: 80 - 120 ppm`);
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

    // Horário de saída
    if (currentData.departureTime) {
      message += `\n⏰ *Horário de Saída:* ${currentData.departureTime}\n`;
    }

    // Observações
    if (currentData.description && currentData.description.trim()) {
      message += `\n📋 *Observações:* ${currentData.description}\n`;
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