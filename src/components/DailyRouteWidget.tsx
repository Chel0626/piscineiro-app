'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';

const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
};

export function DailyRouteWidget() {
  const { clients, authLoading } = useClients();
  const router = useRouter();
  const [visitedToday, setVisitedToday] = useState<Set<string>>(new Set());

  const today = getCurrentDayName();
  const dailyRouteClients = clients.filter(client => {
    // Verificar compatibilidade com dados antigos
    if (client.visitDays) {
      return client.visitDays.includes(today);
    }
    // Fallback para dados antigos com tipo específico
    const legacyClient = client as ClientFormData & { visitDay?: string };
    return legacyClient.visitDay === today;
  });

  // Verificar quais clientes já foram visitados hoje
  useEffect(() => {
    if (!dailyRouteClients.length) return;

    const visitedSet = new Set<string>();
    const unsubscribes: (() => void)[] = [];

    dailyRouteClients.forEach(client => {
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
  }, [dailyRouteClients]);

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
  const pendingClients = dailyRouteClients.filter(client => !visitedToday.has(client.id));
  const completedClients = dailyRouteClients.filter(client => visitedToday.has(client.id));

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Roteiro de Hoje ({today})</CardTitle>
        <CardDescription className="text-sm">
          {pendingClients.length > 0
            ? `Você tem ${pendingClients.length} cliente(s) pendente(s) para visitar hoje.`
            : dailyRouteClients.length > 0 
              ? 'Todas as visitas de hoje foram concluídas! 🎉'
              : 'Você não tem visitas agendadas para hoje.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Clientes pendentes */}
        {pendingClients.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</h4>
            <ul className="space-y-3">
              {pendingClients.map(client => (
                <li key={client.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate text-gray-900 dark:text-gray-100">{client.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{client.neighborhood}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
                    className="w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
                  >
                    <ListChecks className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Check-in
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clientes concluídos */}
        {completedClients.length > 0 && (
          <div className={`space-y-3 ${pendingClients.length > 0 ? 'mt-6' : ''}`}>
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Concluídos</h4>
            <ul className="space-y-2">
              {completedClients.map(client => (
                <li key={client.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-green-800 dark:text-green-200 truncate">{client.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 truncate">{client.neighborhood}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pendingClients.length === 0 && completedClients.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
            Aproveite o dia de descanso!
          </div>
        )}
      </CardContent>
    </Card>
  );
}