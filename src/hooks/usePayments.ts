'use client';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { ClientWithPayment } from '@/lib/validators/clientSchema';

export function usePayments() {
  const markAsPaid = async (clientId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const clientRef = doc(db, 'clients', clientId);
      
      await updateDoc(clientRef, {
        lastPaymentDate: today,
        paymentStatus: 'paid'
      });
      
      toast.success('Pagamento marcado como realizado!');
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error);
      toast.error('Erro ao marcar pagamento');
    }
  };

  const markAsOverdue = async (clientId: string) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      
      await updateDoc(clientRef, {
        paymentStatus: 'overdue'
      });
      
      toast.success('Cliente marcado como inadimplente');
    } catch (error) {
      console.error('Erro ao marcar como vencido:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getPaymentStatus = (client: ClientWithPayment) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se tem status manual definido como pago
    if (client.paymentStatus === 'paid' && client.lastPaymentDate) {
      // Verifica se o pagamento foi neste mês
      const paymentDate = new Date(client.lastPaymentDate + 'T00:00:00'); // Garante parse correto
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return 'paid';
      }
      // Se foi pago em mês anterior, volta para lógica automática
    }
    
    // Lógica automática baseada na data de vencimento
    if (currentDay === client.paymentDueDate) {
      return 'due_today';
    } else if (currentDay > client.paymentDueDate) {
      return 'overdue';
    } else {
      return 'pending';
    }
  };

  return {
    markAsPaid,
    markAsOverdue,
    getPaymentStatus
  };
}