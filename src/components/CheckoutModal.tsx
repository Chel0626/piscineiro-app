'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useProductRequests } from '@/hooks/useProductRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ProductQuantitySelector, ProductWithQuantity } from '@/components/ProductQuantitySelector';
import { ChevronDown, ChevronRight, ClipboardList, Calculator, ShoppingCart, CheckCircle, MessageCircle, Settings } from 'lucide-react';

interface CheckoutModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ clientId, isOpen, onClose }: CheckoutModalProps) {
  const { client, isLoading } = useClientDetails(clientId);
  const { createProductRequest } = useProductRequests();
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

  const [selectedProductsWithQuantity, setSelectedProductsWithQuantity] = useState<ProductWithQuantity[]>([]);

  // Handler para mudanças nos produtos selecionados
  const handleProductsChange = useCallback((products: ProductWithQuantity[]) => {
    setSelectedProductsWithQuantity(products);
  }, []);

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

  const handleVisitSubmit = async (data: VisitFormData) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      setVisitData(data);
      toast.success('Check-out realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível realizar o check-out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!client || !visitData) return;

    const mechanicalStatus = Object.values(mechanicalChecks).filter(Boolean).length;
    const mechanicalItems = [
      { key: 'drainOpen', label: 'Ralo aberto' },
      { key: 'returnOpen', label: 'Retorno aberto' },
      { key: 'filterValve', label: 'Válvula no filtrar' },
      { key: 'drainClosed', label: 'Esgoto fechado' },
      { key: 'timerAutomatic', label: 'Timer no automático' },
    ];
    
    let mechanicalReport = '';
    if (mechanicalStatus > 0) {
      mechanicalReport = `\n🔧 *Conferência Mecânica (${mechanicalStatus}/5):*\n`;
      mechanicalItems.forEach(item => {
        const status = mechanicalChecks[item.key as keyof typeof mechanicalChecks] ? '✅' : '❌';
        mechanicalReport += `${status} ${item.label}\n`;
      });
    }

    let photoInfo = '';
    if (visitData.poolPhoto) {
      photoInfo = `\n📸 *Foto da Piscina:* ${visitData.poolPhoto}\n`;
    }

    const message = `🏊‍♂️ *Relatório de Visita - ${client.name}*\n\n` +
      `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `📍 Endereço: ${client.address}\n` +
      `💧 pH: ${visitData.ph || 'N/A'} | Cloro: ${visitData.cloro || 'N/A'} ppm | Alcalinidade: ${visitData.alcalinidade || 'N/A'} ppm\n` +
      `⏰ Saída: ${visitData.departureTime || 'N/A'}\n` +
      `📋 Observações: ${visitData.description || 'Nenhuma observação'}${photoInfo}${mechanicalReport}\n\n` +
      `✅ Visita concluída com sucesso!`;

    const phoneNumber = client.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Número de telefone não encontrado');
    }
  };

    const handleSendProductsWhatsApp = async () => {
    if (!client || selectedProductsWithQuantity.length === 0) {
      toast.error('Selecione pelo menos um produto antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      // Salvar no banco de dados
      await createProductRequest({
        clientId,
        clientName: client.name,
        clientPhone: client.phone || '',
        products: selectedProductsWithQuantity.map(p => `${p.name} (${p.quantity})`)
      });

      // Criar lista formatada com quantidades
      const productList = selectedProductsWithQuantity
        .filter(p => p && p.name && p.quantity > 0)
        .map(p => `• ${p.name} - Quantidade: ${p.quantity}`)
        .join('\n');

      if (!productList.trim()) {
        toast.error('Nenhum produto válido selecionado');
        return;
      }

      const message = 
        `Preciso dos seguintes produtos para a próxima visita:\n\n` +
        `Cliente: ${client.name}\n` +
        `Data: ${new Date().toLocaleDateString()}\n\n` +
        `Produtos:\n${productList}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Solicitação de produtos enviada e salva no histórico!');

      // Limpar produtos selecionados após envio
      setSelectedProductsWithQuantity([]);

    } catch (error) {
      console.error('Erro ao salvar solicitação de produtos:', error);
      toast.error('Erro ao salvar solicitação de produtos');
    } finally {
      setIsSubmitting(false);
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
    setSelectedProductsWithQuantity([]);
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {client.address} • {client.neighborhood}
          </p>
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

          {/* Seção 2: Calculadora de Produtos */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('calculator')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Calculadora de Produtos
                </div>
                {openSections.calculator ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.calculator && (
              <CardContent>
                <ProductCalculator poolVolume={client?.poolVolume} />
              </CardContent>
            )}
          </Card>

          {/* Seção 3: Checkout Hidráulico */}
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

          {/* Seção 4: Produtos a Solicitar */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('products')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  Produtos a Solicitar
                </div>
                {openSections.products ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.products && (
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecione os produtos e quantidades que deseja solicitar:
                  </p>
                  
                  {/* Novo componente ProductQuantitySelector */}
                  <ProductQuantitySelector 
                    onProductsChange={handleProductsChange}
                    className="w-full"
                  />

                  {/* Botão WhatsApp para Produtos */}
                  {selectedProductsWithQuantity && selectedProductsWithQuantity.length > 0 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          <strong>Selecionados:</strong> {selectedProductsWithQuantity.length} produtos, {selectedProductsWithQuantity.reduce((sum, p) => sum + (p?.quantity || 0), 0)} itens no total
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleSendProductsWhatsApp}
                        disabled={isSubmitting}
                        className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                        variant="default"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {isSubmitting ? 'Enviando...' : 'Enviar Lista de Produtos via WhatsApp'}
                      </Button>
                    </div>
                  )}
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
                    onClick={handleSendWhatsApp}
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