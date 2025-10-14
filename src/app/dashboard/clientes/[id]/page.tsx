'use client';

import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useClientDetails } from '@/hooks/useClientDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ClientProductManager } from '@/components/ClientProductManager';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1 h-auto w-full bg-gray-100 dark:bg-gray-800 p-2 mb-6">
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
            value="calculator" 
            className="text-sm sm:text-base px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 rounded-md font-medium transition-all"
          >
            🧮 Calculadora
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
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Visitas Anteriores</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 sr-only">Visitas Anteriores</h3>
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
        </TabsContent>

        <TabsContent value="calculator">
          <ProductCalculator poolVolume={client.poolVolume} />
        </TabsContent>

        <TabsContent value="products">
          {/* ✅ Substituímos o conteúdo da aba "Produtos" pelo novo componente */}
          <ClientProductManager clientId={clientId} />
        </TabsContent>
        


      </Tabs>
    </div>
  );
}