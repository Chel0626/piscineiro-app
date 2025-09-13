// src/components/PaymentsDueWidget.tsx
'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { User, DollarSign } from 'lucide-react';

export function PaymentsDueWidget() {
  const { clients, authLoading } = useClients();
  const router = useRouter();

  if (authLoading) {
    return null; // Não mostra nada enquanto carrega
  }
  
  const today = new Date().getDate(); // Pega o dia do mês, ex: 14
  const dueClients = clients.filter(client => client.paymentDueDate === today);

  // Se não houver clientes vencendo hoje, não renderiza o card.
  if (dueClients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vencimentos de Hoje</CardTitle>
        <CardDescription>
          {dueClients.length} cliente(s) com mensalidade vencendo hoje.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {dueClients.map(client => (
            <li 
              key={client.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.neighborhood}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>R$ {client.serviceValue.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}