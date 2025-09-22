'use client';

import { useState, useEffect } from 'react';
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
import { ChevronDown, ChevronRight, ClipboardList, Calculator, ShoppingCart, CheckCircle, MessageCircle, Settings } from 'lucide-react';

// Lista completa de produtos disponíveis
const allProducts = [
  'Pastilha de Cloro',
  'Clarificante Líquido',
  'Clarificante Gel',
  'Algicída',
  'Elevador de Alcalinidade',
  'Redutor de pH',
  'Limpa Bordas',
  'Peróxido',
  'Tratamento Semanal',
  'Sulfato de Alumínio',
];

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

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);

  // Inicializar produtos disponíveis (mostrar 5 produtos aleatórios)
  useEffect(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setAvailableProducts(shuffled.slice(0, 5));
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

  const selectProduct = (product: string) => {
    // Adicionar produto à lista de selecionados
    setSelectedProducts(prev => [...prev, product]);
    
    // Remover produto dos disponíveis
    setAvailableProducts(prev => {
      const filtered = prev.filter(p => p !== product);
      
      // Se ainda há produtos não selecionados, adicionar um novo
      const remainingProducts = allProducts.filter(p => 
        !selectedProducts.includes(p) && 
        !filtered.includes(p) && 
        p !== product
      );
      
      if (remainingProducts.length > 0 && filtered.length < 5) {
        const randomProduct = remainingProducts[Math.floor(Math.random() * remainingProducts.length)];
        return [...filtered, randomProduct];
      }
      
      return filtered;
    });
  };

  const removeProduct = (product: string) => {
    setSelectedProducts(prev => prev.filter(p => p !== product));
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

    const message = `🏊‍♂️ *Relatório de Visita - ${client.name}*\n\n` +
      `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `📍 Endereço: ${client.address}\n` +
      `📋 Observações: ${visitData.description || 'Nenhuma observação'}${mechanicalReport}\n\n` +
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
    if (!client || selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      // Salvar solicitação no histórico
      await createProductRequest({
        clientId,
        clientName: client.name,
        clientPhone: client.phone || '',
        products: selectedProducts
      });

      // Criar mensagem para WhatsApp
      let productsList = '';
      selectedProducts.forEach(product => {
        productsList += `• ${product}\n`;
      });

      const message = `Olá ${client.name}, tudo bem?\n\n` +
        `Preciso dos seguintes produtos para a próxima visita:\n\n` +
        `${productsList}\n` +
        `Devo levar ou você providencia?`;

      // Enviar por WhatsApp
      const phoneNumber = client.phone?.replace(/\D/g, '');
      if (phoneNumber) {
        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('Solicitação de produtos enviada e salva no histórico!');
      } else {
        toast.success('Solicitação salva no histórico! (Telefone não encontrado para WhatsApp)');
      }

      // Limpar produtos selecionados após envio
      setSelectedProducts([]);
      
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
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
    setSelectedProducts([]);
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setAvailableProducts(shuffled.slice(0, 5));
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

          {/* Seção 3: Checkout Mecânico */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('mechanical')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Checkout Mecânico
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
                    Clique nos produtos que deseja solicitar:
                  </p>
                  
                  {/* Produtos Disponíveis */}
                  {availableProducts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-purple-700 dark:text-purple-300">
                        Produtos Disponíveis:
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {availableProducts.map((product) => (
                          <Button
                            key={product}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectProduct(product)}
                            className="text-left justify-start h-auto py-2 px-3 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                          >
                            <ShoppingCart className="h-3 w-3 mr-2 text-purple-600" />
                            {product}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Produtos Selecionados */}
                  {selectedProducts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-green-700 dark:text-green-300">
                        Produtos Selecionados ({selectedProducts.length}):
                      </h4>
                      <div className="space-y-2">
                        {selectedProducts.map((product) => (
                          <div
                            key={product}
                            className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                {product}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estado vazio */}
                  {availableProducts.length === 0 && selectedProducts.length === 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Todos os produtos foram selecionados!</p>
                    </div>
                  )}

                  {/* Resumo */}
                  {(selectedProducts.length > 0 || availableProducts.length > 0) && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          <strong>Selecionados:</strong> {selectedProducts.length} produtos
                        </p>
                      </div>
                      
                      {/* Botão WhatsApp para Produtos */}
                      {selectedProducts.length > 0 && (
                        <Button 
                          onClick={handleSendProductsWhatsApp}
                          disabled={isSubmitting}
                          className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                          variant="default"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {isSubmitting ? 'Enviando...' : 'Enviar Lista de Produtos via WhatsApp'}
                        </Button>
                      )}
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