'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


import { Button } from '@/components/ui/button';
import { ListChecks, CheckCircle, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DayReschedule } from '@/components/DayReschedule';
import { ClientDetails } from '@/components/ClientDetails';
import { useTemporaryReschedule } from '@/hooks/useTemporaryReschedule';

const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
};

type DailyClient = ClientFormData & { 
  id: string; 
  isRescheduled?: boolean; 
  originalDay?: string 
};

type RescheduledClient = ClientFormData & { 
  id: string; 
  isRescheduled: true; 
  originalDay: string 
};

export function DailyRouteWidget() {
  const { clients, authLoading } = useClients();
  const { getClientsForDay, isClientMovedAway } = useTemporaryReschedule();
  const [visitedToday, setVisitedToday] = useState<Set<string>>(new Set());
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);
  // Estados para modais customizados
  const [modalType, setModalType] = useState<'relatorio' | 'concluir' | null>(null);
  const [modalClient, setModalClient] = useState<(ClientFormData & { id: string }) | DailyClient | RescheduledClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Função para finalizar visita com feedback visual
  // Estado para controlar qual cliente está expandido
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const handleFinalizeVisit = async (clientId: string) => {
    setLoadingClientId(clientId);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        timestamp: Timestamp.now(),
        finalized: true,
      });
      setVisitedToday(prev => {
        const newSet = new Set(prev);
        newSet.add(clientId);
        return newSet;
      });
      // Toast de sucesso
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => toast.success('Visita finalizada com sucesso!'));
      }
    } catch (error) {
      console.error('Erro ao finalizar visita:', error);
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => toast.error('Erro ao finalizar visita!'));
      }
    } finally {
      setLoadingClientId(null);
    }
  };
  const [isExpanded, setIsExpanded] = useState(true);
  // Removido uso do CheckoutModal para Relatório

  const today = getCurrentDayName();
  
  // Clientes do roteiro original + clientes reagendados para hoje
  const originalDailyRouteClients = clients.filter(client => {
    // Verificar compatibilidade com dados antigos
    if (client.visitDays) {
      return client.visitDays.includes(today);
    }
    // Fallback para dados antigos com tipo específico
    const legacyClient = client as ClientFormData & { visitDay?: string };
    return legacyClient.visitDay === today;
  });

  // Filtrar clientes que foram movidos para outro dia
  const activeOriginalClients = originalDailyRouteClients.filter(client => 
    !isClientMovedAway(client.id, today)
  );

  // Adicionar clientes reagendados para hoje
  const rescheduledForToday = getClientsForDay(today);
  const rescheduledClients = rescheduledForToday
    .map(reschedule => {
      const client = clients.find(c => c.id === reschedule.clientId);
      if (!client) return null;
      return { 
        ...client, 
        isRescheduled: true as const, 
        originalDay: reschedule.originalDay 
      };
    })
    .filter(client => client !== null);

  // Combinar todos os clientes do dia
  const allDailyClients: (DailyClient | RescheduledClient)[] = useMemo(() => 
    [...activeOriginalClients, ...rescheduledClients], 
    [activeOriginalClients, rescheduledClients]
  );

  // Verificar quais clientes já foram visitados hoje
  useEffect(() => {
    if (!allDailyClients.length) return;

    const visitedSet = new Set<string>();
    const unsubscribes: (() => void)[] = [];

    allDailyClients.forEach(client => {
      const visitsRef = collection(db, 'clients', client.id, 'visits');
      
      // Buscar visitas de hoje
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const q = query(
        visitsRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay))
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          visitedSet.add(client.id);
        } else {
          visitedSet.delete(client.id);
        }
        setVisitedToday(new Set(visitedSet));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [allDailyClients]);

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Roteiro do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar apenas clientes que ainda não foram visitados
  const pendingClients = allDailyClients.filter(client => !visitedToday.has(client.id));
  const completedClients = allDailyClients.filter(client => visitedToday.has(client.id));

  // Limitar exibição inicial
  const displayedPendingClients = showAllPending ? pendingClients : pendingClients.slice(0, 2);
  const displayedCompletedClients = showAllCompleted ? completedClients : completedClients.slice(0, 2);

  // Handler para abrir modal Relatório
  const handleOpenRelatorio = (client: DailyClient | RescheduledClient) => {
    setModalType('relatorio');
    setModalClient(client);
  };
  // Handler para abrir modal Concluir
  const handleOpenConcluir = (client: DailyClient | RescheduledClient) => {
    setModalType('concluir');
    setModalClient(client);
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg">Roteiro de Hoje ({today})</CardTitle>
            <CardDescription className="text-sm">
              {pendingClients.length > 0
                ? `${pendingClients.length} pendente(s) • ${completedClients.length} concluído(s)`
                : allDailyClients.length > 0 
                  ? 'Todas as visitas concluídas! 🎉'
                  : 'Sem visitas agendadas'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 dark:text-gray-400"
          >
            {isExpanded ? 'Ocultar' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        {/* Clientes pendentes */}
        {pendingClients.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</h4>
            <ul className="space-y-3">
              {displayedPendingClients.map(client => (
                <li
                  key={client.id}
                  className={`flex flex-col gap-2 p-3 rounded-lg transition-all ${
                    ('isRescheduled' in client && client.isRescheduled)
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  {/* Card expansível: clique no nome para expandir */}
                  <div className="flex items-center gap-2 min-w-0 cursor-pointer group" onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}>
                    <p className="font-semibold text-base sm:text-lg truncate text-gray-900 dark:text-gray-100 flex-1 group-hover:underline">
                      {client.name && client.name.trim().length > 0 ? client.name : `Cliente ${client.id}`}
                    </p>
                    {('isRescheduled' in client && client.isRescheduled) && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <UserPlus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Reagendado
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                      {client.neighborhood}
                      {('isRescheduled' in client && client.isRescheduled) && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          (movido de {client.originalDay})
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Detalhes extras do cliente (expansível) */}
                  {expandedClientId === client.id && (
                    <ClientDetails clientId={client.id} phone={client.phone} address={client.address} />
                  )}
                  {/* Rodapé do Card: Ações horizontais e calculadora flutuante */}
                  <div className="flex flex-row items-center gap-2 justify-between mt-3">
                    {/* Ícone Calculadora flutuante */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2 text-blue-600 hover:bg-blue-50"
                      title="Abrir Calculadora de Dosagem"
                      onClick={() => {/* TODO: abrir modal/calculadora */}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/><circle cx="8" cy="8" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><rect x="7" y="12" width="2" height="2" rx="0.5"/><rect x="11" y="12" width="2" height="2" rx="0.5"/><rect x="15" y="12" width="2" height="2" rx="0.5"/></svg>
                    </Button>
                    <div className="flex flex-1 flex-row gap-2 justify-end">
                      {/* Botão Relatório (azul) */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm flex-1 border-blue-600 text-blue-700 hover:bg-blue-50 hover:border-blue-700"
                        onClick={() => handleOpenRelatorio(client)}
                        disabled={loadingClientId === client.id}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="4" width="12" height="16" rx="2" strokeWidth="2"/><path d="M9 8h6M9 12h6M9 16h6" strokeWidth="2"/></svg>
                        Relatório
                      </Button>
                      {/* Botão Concluir (verde) */}
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs sm:text-sm flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleOpenConcluir(client)}
                        disabled={loadingClientId === client.id}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="2"/></svg>
                        Concluir
                      </Button>
                      {/* Botão Mover Dia, alinhado à direita */}
                      {!('isRescheduled' in client && client.isRescheduled) && (
                        <div className="flex items-center ml-2">
                          <DayReschedule
                            clientId={client.id}
                            clientName={client.name}
                            originalDay={today}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Botão mostrar mais para pendentes */}
            {pendingClients.length > 2 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPending(!showAllPending)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {showAllPending 
                    ? 'Mostrar menos' 
                    : `Mostrar todos (${pendingClients.length - 2} restantes)`
                  }
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Clientes concluídos */}
        {completedClients.length > 0 && (
          <div className={`space-y-3 ${pendingClients.length > 0 ? 'mt-6' : ''}`}>
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Concluídos</h4>
            <ul className="space-y-2">
              {displayedCompletedClients.map(client => (
                <li key={client.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-green-800 dark:text-green-200 truncate">{client.name && client.name.trim().length > 0 ? client.name : `Cliente ${client.id}`}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 truncate">{client.neighborhood}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Botão mostrar mais para concluídos */}
            {completedClients.length > 2 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                >
                  {showAllCompleted 
                    ? 'Mostrar menos' 
                    : `Mostrar todos (${completedClients.length - 2} restantes)`
                  }
                </Button>
              </div>
            )}
          </div>
        )}

        {pendingClients.length === 0 && completedClients.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
            Aproveite o dia de descanso!
          </div>
        )}
        </CardContent>
      )}

      {/* Modal customizado para Relatório e Concluir */}
      <Dialog open={!!modalType && !!modalClient} onOpenChange={open => { if (!open) { setModalType(null); setModalClient(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'relatorio' ? 'Registrar Relatório Completo' : 'Finalizar Visita Expressa'}
            </DialogTitle>
          </DialogHeader>
          {modalClient && (
            <div className="space-y-4">
              <div className="text-sm font-semibold mb-2">Cliente: {modalClient.name}</div>
              {modalType === 'relatorio' ? (
                <VisitForm
                  clientId={modalClient.id}
                  isLoading={isSubmitting}
                  onSubmit={async (data: VisitFormData) => {
                    setIsSubmitting(true);
                    try {
                      // Salva visita detalhada no Firestore
                      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                      const { db } = await import('@/lib/firebase');
                      await addDoc(collection(db, 'clients', modalClient.id, 'visits'), {
                        ...data,
                        timestamp: serverTimestamp(),
                        finalized: true,
                      });
                      if (typeof window !== 'undefined') {
                        const { toast } = await import('sonner');
                        toast.success('Relatório registrado com sucesso!');
                      }
                      setModalType(null);
                      setModalClient(null);
                    } catch (error) {
                      if (typeof window !== 'undefined') {
                        const { toast } = await import('sonner');
                        toast.error('Erro ao registrar relatório!');
                      }
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                />
              ) : (
                <div>
                  {/* TODO: Formulário simplificado de conclusão */}
                  <div className="text-gray-500">Confirmação rápida para finalizar visita.</div>
                </div>
              )}
            </div>
          )}
          {modalType === 'concluir' && modalClient && (
            <DialogFooter>
              <Button onClick={() => {
                handleFinalizeVisit(modalClient.id);
                setModalType(null);
                setModalClient(null);
              }}>
                Finalizar Visita
              </Button>
              <Button variant="ghost" onClick={() => { setModalType(null); setModalClient(null); }}>Cancelar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}