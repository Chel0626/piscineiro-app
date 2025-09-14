'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
          <CardTitle className="text-base sm:text-lg">Roteiro do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  const today = getCurrentDayName();
  const dailyRouteClients = clients.filter(client => client.visitDay === today);

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Roteiro de Hoje ({today})</CardTitle>
        <CardDescription className="text-sm">
          {dailyRouteClients.length > 0
            ? `Você tem ${dailyRouteClients.length} cliente(s) para visitar hoje.`
            : 'Você não tem visitas agendadas para hoje.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dailyRouteClients.length > 0 ? (
          <ul className="space-y-3">
            {dailyRouteClients.map(client => (
              <li key={client.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {/* Informações do cliente */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{client.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{client.neighborhood}</p>
                </div>
                
                {/* Botão de check-in */}
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
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm">
            Aproveite o dia de descanso!
          </div>
        )}
      </CardContent>
    </Card>
  );
}