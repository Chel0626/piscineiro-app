'use client';

import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User, DollarSign, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { ClientWithPayment } from '@/lib/validators/clientSchema';
import { toast } from 'sonner';

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

  const handleSendWhatsApp = (client: ClientWithPayment, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clique no card
    
    if (!client.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }

    const message = `Olá, ${client.name}, tudo bem?\nNosso mês venceu. Obrigado!`;
    const whatsappUrl = `https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com a mensagem de cobrança!');
  };

  const getTotalOverdue = () => {
    return overdueClients.reduce((total, client) => total + client.serviceValue, 0);
  };

  return (
    <Card className="border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30">
      <CardHeader>
        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Pagamentos Vencidos
        </CardTitle>
        <CardDescription className="dark:text-red-300">
          {overdueClients.length} cliente(s) com mensalidade em atraso.
          <br />
          <strong className="text-red-600 dark:text-red-400">Total: R$ {getTotalOverdue().toFixed(2)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {overdueClients.map(client => {
            const daysOverdue = new Date().getDate() - client.paymentDueDate;
            
            return (
              <li 
                key={client.id} 
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-800/30"
                onClick={() => router.push(`/dashboard/clientes/${client.id}`)}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-red-500 dark:text-red-400" />
                  <div>
                    <p className="font-semibold dark:text-white">{client.name}</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{client.neighborhood}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {daysOverdue > 0 ? `${daysOverdue} dia(s) em atraso` : 'Venceu hoje'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
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

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={(e) => handleSendWhatsApp(client, e)}
                    disabled={!client.phone}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Cobrar
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