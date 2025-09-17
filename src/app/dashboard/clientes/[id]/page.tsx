'use client';

import { useState } from 'react';
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
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ClientProductManager } from '@/components/ClientProductManager'; // Importe o novo componente

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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