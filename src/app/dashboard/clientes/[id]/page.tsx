'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useClientDetails } from '@/hooks/useClientDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ArrowLeft, Edit, Trash2, MessageCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ClientProductManager } from '@/components/ClientProductManager'; // Importe o novo componente

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

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Estados para o solicitar produtos
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);

  // Inicializar produtos disponíveis (mostrar 5 produtos aleatórios)
  useEffect(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    setAvailableProducts(shuffled.slice(0, 5));
  }, []);

  const handleVisitSubmit = async (data: VisitFormData) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      toast.success('Visita registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível registrar a visita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVisit = async (visitId: string, data: VisitFormData) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitDocRef = doc(db, 'clients', clientId, 'visits', visitId);
      await updateDoc(visitDocRef, {
        ...data,
        // Manter o timestamp original
      });
      toast.success('Visita editada com sucesso!');
      setEditingVisitId(null);
    } catch (error) {
      console.error('Erro ao editar visita:', error);
      toast.error('Não foi possível editar a visita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!clientId) return;
    setIsDeleting(visitId);
    try {
      const visitDocRef = doc(db, 'clients', clientId, 'visits', visitId);
      await deleteDoc(visitDocRef);
      toast.success('Visita deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar visita:', error);
      toast.error('Não foi possível deletar a visita.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSendHistoryWhatsApp = (visit: { id: string; timestamp: { toDate: () => Date }; ph?: number; cloro?: number; alcalinidade?: number; arrivalTime?: string; departureTime?: string; observations?: string; photoUrl?: string }) => {
    if (!client?.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }

    const visitDate = visit.timestamp?.toDate().toLocaleDateString('pt-BR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    });

    let message = `🏊‍♂️ *Relatório de Visita - ${client.name}*\n\n`;
    message += `📅 Data: ${visitDate}\n`;
    message += `📍 Endereço: ${client.address}\n\n`;
    
    // Parâmetros da água
    message += `💧 *Parâmetros da Água:*\n`;
    message += `• pH: ${visit.ph}\n`;
    message += `• Cloro: ${visit.cloro} ppm\n`;
    message += `• Alcalinidade: ${visit.alcalinidade} ppm\n\n`;
    
    // Horários se disponíveis
    if (visit.departureTime) {
      message += `⏰ *Horário de Saída:* ${visit.departureTime}\n\n`;
    }
    
    // Observações
    if (visit.observations) {
      message += `📝 *Observações:*\n${visit.observations}\n\n`;
    }
    
    message += `✅ Serviço realizado com sucesso!`;

    const phoneNumber = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com o relatório da visita!');
  };

  // Funções para gerenciar produtos
  const selectProduct = (product: string) => {
    // Adicionar produto à lista de selecionados
    setSelectedProducts(prev => [...prev, product]);
    
    // Remover produto dos disponíveis
    setAvailableProducts(prev => prev.filter(p => p !== product));
    
    // Adicionar novo produto aleatório se ainda houver disponíveis
    const remainingProducts = allProducts.filter(p => 
      !selectedProducts.includes(p) && 
      !availableProducts.filter(ap => ap !== product).includes(p)
    );
    
    if (remainingProducts.length > 0) {
      const randomProduct = remainingProducts[Math.floor(Math.random() * remainingProducts.length)];
      setAvailableProducts(prev => [...prev.filter(p => p !== product), randomProduct]);
    } else {
      setAvailableProducts(prev => prev.filter(p => p !== product));
    }
  };

  const removeProduct = (product: string) => {
    // Remover produto dos selecionados
    setSelectedProducts(prev => prev.filter(p => p !== product));
    
    // Se há menos de 5 produtos disponíveis, adicionar este de volta
    if (availableProducts.length < 5) {
      setAvailableProducts(prev => [...prev, product]);
    }
  };

  const handleSendProductsWhatsApp = () => {
    if (!client?.phone || selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto antes de enviar');
      return;
    }

    let productsList = '';
    selectedProducts.forEach(product => {
      productsList += `• ${product}\n`;
    });

    const message = `Olá ${client.name}, tudo bem?\n\n` +
      `Preciso dos seguintes produtos para a próxima visita:\n\n` +
      `${productsList}\n` +
      `Devo levar ou você providencia?`;

    const phoneNumber = client.phone.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Mensagem de produtos enviada!');
    } else {
      toast.error('Número de telefone inválido');
    }
  };

  if (isLoading) {
    return <div className="text-center p-6 text-sm sm:text-base">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="text-center p-6 text-sm sm:text-base">Cliente não encontrado.</div>;
  }

  return (
    <div className="p-2 sm:p-4">
      {/* Header responsivo */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard/clientes" className="p-2 rounded-md hover:bg-gray-200 flex-shrink-0">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{client.name}</h1>
      </div>

      <Tabs defaultValue="history" className="w-full">
        {/* TabsList melhorada com espaçamento adequado */}
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-1 h-auto w-full bg-gray-100 dark:bg-gray-800 p-2 mb-6">
          <TabsTrigger 
            value="data" 
            className="text-sm sm:text-base px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md font-medium transition-all"
          >
            📋 Dados
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="text-sm sm:text-base px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md font-medium transition-all"
          >
            📝 Histórico
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="text-sm sm:text-base px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md font-medium transition-all"
          >
            🧪 Produtos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Endereço</p>
                  <p className="text-sm sm:text-base">{`${client.address}, ${client.neighborhood}`}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Telefone</p>
                  <p className="text-sm sm:text-base">{client.phone || 'Não cadastrado'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Frequência</p>
                  <p className="text-sm sm:text-base">
                    {client.visitFrequency === 'biweekly' ? '2x por semana' : '1x por semana'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    {client.visitDays?.length > 1 ? 'Dias das Visitas' : 'Dia da Visita'}
                  </p>
                  <p className="text-sm sm:text-base">
                    {client.visitDays ? client.visitDays.join(', ') : 
                     (client as typeof client & { visitDay?: string }).visitDay || 'Não definido'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Valor do Contrato (R$)</p>
                  <p className="text-sm sm:text-base">{client.serviceValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Volume da Piscina (m³)</p>
                  <p className="text-sm sm:text-base">{client.poolVolume} m³</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4 sm:space-y-6">
            
            {/* Calculadora de Produtos */}
            <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-blue-50 [&[open]>summary>span:last-child]:rotate-180">
              <summary className="cursor-pointer p-4 font-medium text-blue-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🧮 Calculadora de Produtos
                </span>
                <span className="text-gray-400 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-4 border-t border-gray-200 bg-white">
                <ProductCalculator poolVolume={client.poolVolume} />
              </div>
            </details>
            
            {/* Registrar Nova Visita */}
            <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-green-50 [&[open]>summary>span:last-child]:rotate-180">
              <summary className="cursor-pointer p-4 font-medium text-green-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  📝 Registrar Nova Visita
                </span>
                <span className="text-gray-400 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-4 border-t border-gray-200 bg-white">
                <VisitForm 
                  onSubmit={handleVisitSubmit} 
                  isLoading={isSubmitting}
                  clientId={clientId} 
                />
              </div>
            </details>

            {/* Solicitar Produtos */}
            <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-orange-50 [&[open]>summary>span:last-child]:rotate-180">
              <summary className="cursor-pointer p-4 font-medium text-orange-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🛒 Solicitar Produtos
                </span>
                <span className="text-gray-400 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                
                {/* Produtos Disponíveis */}
                {availableProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-orange-700">
                      Produtos Disponíveis:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableProducts.map((product) => (
                        <Button
                          key={product}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => selectProduct(product)}
                          className="text-left justify-start h-auto py-3 px-3 border-orange-200 hover:border-orange-400 hover:bg-orange-50 whitespace-normal text-wrap min-h-[44px]"
                        >
                          <ShoppingCart className="h-3 w-3 mr-2 text-orange-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{product}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produtos Selecionados */}
                {selectedProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-green-700">
                      Produtos Selecionados ({selectedProducts.length}):
                    </h4>
                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <div
                          key={product}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 min-h-[48px]"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-green-800 break-words">
                              {product}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
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
                  <div className="text-center py-6 text-gray-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Todos os produtos foram selecionados!</p>
                  </div>
                )}

                {/* Resumo e Botão WhatsApp */}
                {(selectedProducts.length > 0 || availableProducts.length > 0) && (
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-700">
                        <strong>Selecionados:</strong> {selectedProducts.length} produtos
                      </p>
                    </div>
                    
                    {/* Botão WhatsApp para Produtos */}
                    {selectedProducts.length > 0 && (
                      <Button 
                        type="button"
                        onClick={handleSendProductsWhatsApp}
                        className="w-full flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                        variant="default"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar Lista de Produtos via WhatsApp
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </details>

            {/* Histórico de Visitas */}
            <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-purple-50 [&[open]>summary>span:last-child]:rotate-180" open>
              <summary className="cursor-pointer p-4 font-medium text-purple-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  📚 Histórico de Visitas ({visits.length})
                </span>
                <span className="text-gray-400 transition-transform duration-200">▼</span>
              </summary>
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="space-y-3 sm:space-y-4">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <div key={visit.id} className="p-3 sm:p-4 border rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-sm sm:text-base">
                            {visit.timestamp?.toDate().toLocaleDateString('pt-BR', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendHistoryWhatsApp(visit)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled={!client?.phone}
                              title="Enviar relatório para cliente"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingVisitId(visit.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isDeleting === visit.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar Visita</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar esta visita? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteVisit(visit.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {editingVisitId === visit.id ? (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-3">Editar Visita</h4>
                            <VisitForm 
                              onSubmit={(data) => handleEditVisit(visit.id, data)}
                              isLoading={isSubmitting}
                              clientId={clientId}
                              initialData={visit}
                            />
                            <Button
                              variant="outline"
                              onClick={() => setEditingVisitId(null)}
                              className="mt-3"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs sm:text-sm">
                              <span><strong>pH:</strong> {visit.ph}</span>
                              <span><strong>Cloro:</strong> {visit.cloro} ppm</span>
                              <span><strong>Alcalinidade:</strong> {visit.alcalinidade} ppm</span>
                            </div>

                            {visit.description && (
                              <div className="text-xs sm:text-sm">
                                <strong>Observações:</strong>
                                <p className="mt-1 text-gray-600">{visit.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-center text-gray-500 py-4">
                      Nenhum registro de visita encontrado.
                    </p>
                  )}
                </div>
              </div>
            </details>
          </div>
        </TabsContent>

        <TabsContent value="products">
          {/* ✅ Substituímos o conteúdo da aba "Produtos" pelo novo componente */}
          <ClientProductManager clientId={clientId} />
        </TabsContent>
        


      </Tabs>
    </div>
  );
}