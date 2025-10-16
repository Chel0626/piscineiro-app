'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, CheckCircle, UserPlus } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DayReschedule } from '@/components/DayReschedule';
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

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

  const handleCheckout = (clientId: string) => {
    setSelectedClientId(clientId);
    setCheckoutModalOpen(true);
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
                <li key={client.id} className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm sm:text-base truncate text-gray-900 dark:text-gray-100">
                          {client.name}
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
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {client.neighborhood}
                        {('isRescheduled' in client && client.isRescheduled) && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            (movido de {client.originalDay})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCheckout(client.id)}
                      className="flex-shrink-0 text-xs sm:text-sm"
                    >
                      <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Check-out
                    </Button>
                  </div>

                  {/* Botão de reagendamento apenas para clientes originais */}
                  {!('isRescheduled' in client && client.isRescheduled) && (
                    <div className="flex justify-end">
                      <DayReschedule
                        clientId={client.id}
                        clientName={client.name}
                        originalDay={today}
                      />
                    </div>
                  )}
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
                    <p className="font-semibold text-sm text-green-800 dark:text-green-200 truncate">{client.name}</p>
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

      {/* Modal de Check-out */}
      <CheckoutModal
        clientId={selectedClientId}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
      />
    </Card>
  );
}