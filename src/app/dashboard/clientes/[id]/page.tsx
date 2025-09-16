'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useClientDetails } from '@/hooks/useClientDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ArrowLeft } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ClientProductManager } from '@/components/ClientProductManager'; // Importe o novo componente

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        {/* TabsList responsiva com quebra de linha */}
        <TabsList className="grid grid-cols-2 sm:flex sm:flex-wrap h-auto w-full sm:w-auto mb-4 sm:mb-6">
          <TabsTrigger value="data" className="text-xs sm:text-sm px-2 sm:px-4">
            Dados
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-4">
            Produtos
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
          <div className="space-y-4 sm:space-y-8">
            <ProductCalculator poolVolume={client.poolVolume} />
            
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Registrar Nova Visita</CardTitle>
              </CardHeader>
              <CardContent>
                <VisitForm 
                  onSubmit={handleVisitSubmit} 
                  isLoading={isSubmitting}
                  clientId={clientId} 
                />
                
                <Separator className="my-4 sm:my-8" />

                <h3 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4">Visitas Anteriores</h3>
                <div className="space-y-3 sm:space-y-4">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <div key={visit.id} className="p-3 sm:p-4 border rounded-md">
                        <p className="font-semibold text-sm sm:text-base mb-2">
                          {visit.timestamp?.toDate().toLocaleDateString('pt-BR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs sm:text-sm">
                            <span><strong>pH:</strong> {visit.ph}</span>
                            <span><strong>Cloro:</strong> {visit.cloro} ppm</span>
                            <span><strong>Alcalinidade:</strong> {visit.alcalinidade} ppm</span>
                          </div>
                          
                          {visit.productsUsed?.length > 0 && (
                            <div className="text-xs sm:text-sm">
                              <strong>Produtos Utilizados:</strong>
                              <div className="mt-1 space-y-1">
                                {visit.productsUsed.map((product, index) => (
                                  <div key={index}>
                                    {product.productName} (x{product.quantity})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {visit.productsRequested?.length > 0 && (
                            <div className="text-xs sm:text-sm">
                              <strong>Produtos Solicitados:</strong>
                              <div className="mt-1 space-y-1">
                                {visit.productsRequested.map((product, index) => (
                                  <div key={index}>
                                    {product.productName} (x{product.quantity})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-center text-gray-500 py-4">
                      Nenhum registro de visita encontrado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
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