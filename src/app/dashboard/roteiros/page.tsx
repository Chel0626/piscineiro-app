'use client';

import { toast } from 'sonner';
import { useRoutines } from '@/hooks/useRoutines';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth'; // Importar aqui
import { auth } from '@/lib/firebase'; // Importar aqui

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function RoteirosPage() {
  // 1. A página, que é um Client Component, agora obtém o usuário
  const [user, authLoading] = useAuthState(auth);

  // 2. O usuário é passado como parâmetro para o hook de lógica
  const { isLoading, groupedClients } = useRoutines(user);

  const handleOptimizeRoute = () => {
    toast.info('Funcionalidade de otimização de rota em desenvolvimento!');
  };

  // Usamos o authLoading para a tela inicial de carregamento
  if (authLoading || isLoading) {
    return <div>Carregando roteiros...</div>;
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Roteiros da Semana</h1>
        <p className="text-muted-foreground">Veja seus clientes organizados por dia de visita.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => {
          const clientsForDay = groupedClients[day] || [];
          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{day}</CardTitle>
                <CardDescription>{clientsForDay.length} cliente(s) agendado(s)</CardDescription>
              </Header>
              <CardContent>
                {clientsForDay.length > 0 ? (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {clientsForDay.map((client) => (
                        <li key={client.id} className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 mt-1 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{`${client.address}, ${client.neighborhood}`}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={handleOptimizeRoute}>Otimizar Rota</Button>
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">Nenhum cliente agendado para este dia.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}