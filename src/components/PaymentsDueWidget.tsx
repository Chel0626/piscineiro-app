// src/components/PaymentsDueWidget.tsx
'use client';

import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { ClientWithPayment } from '@/lib/validators/clientSchema';

export function PaymentsDueWidget() {
  const { clients, authLoading } = useClients();
  const { markAsPaid, getPaymentStatus } = usePayments();
  const router = useRouter();

  if (authLoading) {
    return null; // Não mostra nada enquanto carrega
  }
  
  // Filtrar clientes que vencem hoje e ainda não pagaram
  const dueClients = clients.filter((client: ClientWithPayment) => {
    const status = getPaymentStatus(client);
    return status === 'due_today';
  });

  // Se não houver clientes vencendo hoje, não renderiza o card.
  if (dueClients.length === 0) {
    return null;
  }

  const handleMarkAsPaid = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clique no card
    await markAsPaid(clientId);
  };

  const getTotalDue = () => {
    return dueClients.reduce((total, client) => total + client.serviceValue, 0);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30">
      <CardHeader>
        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Vencimentos de Hoje
        </CardTitle>
        <CardDescription className="dark:text-orange-300">
          {dueClients.length} cliente(s) com mensalidade vencendo hoje.
          <br />
          <strong className="text-orange-600 dark:text-orange-400">Total: R$ {getTotalDue().toFixed(2)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {dueClients.map(client => (
            <li 
              key={client.id} 
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-800/30"
              onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                <div>
                    <p className="font-semibold dark:text-white">{client.name}</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{client.neighborhood}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Vence hoje</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span>R$ {client.serviceValue.toFixed(2)}</span>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                  onClick={(e) => handleMarkAsPaid(client.id, e)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Pago
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}