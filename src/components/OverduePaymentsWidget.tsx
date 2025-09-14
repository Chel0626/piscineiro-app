'use client';

import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { ClientWithPayment } from '@/lib/validators/clientSchema';

export function OverduePaymentsWidget() {
  const { clients, authLoading } = useClients();
  const { markAsPaid, getPaymentStatus } = usePayments();
  const router = useRouter();

  if (authLoading) {
    return null;
  }
  
  // Filtrar clientes com pagamentos vencidos
  const overdueClients = clients.filter((client: ClientWithPayment) => {
    const status = getPaymentStatus(client);
    return status === 'overdue';
  });

  // Se não houver clientes vencidos, não renderiza o card
  if (overdueClients.length === 0) {
    return null;
  }

  const handleMarkAsPaid = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clique no card
    await markAsPaid(clientId);
  };

  const getTotalOverdue = () => {
    return overdueClients.reduce((total, client) => total + client.serviceValue, 0);
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Pagamentos Vencidos
        </CardTitle>
        <CardDescription>
          {overdueClients.length} cliente(s) com mensalidade em atraso.
          <br />
          <strong className="text-red-600">Total: R$ {getTotalOverdue().toFixed(2)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {overdueClients.map(client => {
            const daysOverdue = new Date().getDate() - client.paymentDueDate;
            
            return (
              <li 
                key={client.id} 
                className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg cursor-pointer hover:bg-red-50"
                onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.neighborhood}</p>
                    <p className="text-xs text-red-600">
                      {daysOverdue > 0 ? `${daysOverdue} dia(s) em atraso` : 'Venceu hoje'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {client.serviceValue.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={(e) => handleMarkAsPaid(client.id, e)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Pago
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}