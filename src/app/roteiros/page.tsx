'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Reutilizamos a definição de tipo dos nossos clientes
// Em um projeto maior, isso ficaria em um arquivo types/index.ts
interface Client {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  visitDay: string;
  // ...outros campos que não precisamos exibir aqui
}

// Estrutura para agrupar os clientes por dia
interface GroupedClients {
  [day: string]: Client[];
}

// Ordem correta dos dias da semana para exibição
const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export default function RoteirosPage() {
  const [user] = useAuthState(auth);
  const [groupedClients, setGroupedClients] = useState<GroupedClients>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...(doc.data() as any) });
        });

        // Agrupa os clientes por dia da visita
        const grouped = clientsData.reduce((acc, client) => {
          const day = client.visitDay;
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(client);
          return acc;
        }, {} as GroupedClients);

        setGroupedClients(grouped);
        setIsLoading(false);
      });

      // Limpa o listener quando o componente é desmontado
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleOptimizeRoute = () => {
    toast.info('Funcionalidade de otimização de rota em desenvolvimento!');
  };

  if (isLoading) {
    return <div>Carregando roteiros...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Roteiros da Semana</h1>
        <p className="text-muted-foreground">
          Veja seus clientes organizados por dia de visita.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => {
          const clientsForDay = groupedClients[day] || [];
          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{day}</CardTitle>
                <CardDescription>
                  {clientsForDay.length} cliente(s) agendado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientsForDay.length > 0 ? (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {clientsForDay.map((client) => (
                        <li key={client.id} className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 mt-1 text-gray-500 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {`${client.address}, ${client.neighborhood}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={handleOptimizeRoute}>
                      Otimizar Rota
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">
                    Nenhum cliente agendado para este dia.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}