// src/components/DailyRouteWidget.tsx
'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Função para obter o dia da semana atual em português
const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
};

export function DailyRouteWidget() {
  const { clients, authLoading } = useClients();
  const router = useRouter();

  if (authLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Roteiro do Dia</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Carregando clientes...</p>
            </CardContent>
        </Card>
    );
  }

  const today = getCurrentDayName();
  const dailyRouteClients = clients.filter(client => client.visitDay === today);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roteiro de Hoje ({today})</CardTitle>
        <CardDescription>
          {dailyRouteClients.length > 0
            ? `Você tem ${dailyRouteClients.length} cliente(s) para visitar hoje.`
            : 'Você não tem visitas agendadas para hoje.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dailyRouteClients.length > 0 ? (
          <ul className="space-y-4">
            {dailyRouteClients.map(client => (
              <li key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.neighborhood}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Check-in
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 py-4">
            Aproveite o dia de descanso!
          </div>
        )}
      </CardContent>
    </Card>
  );
}