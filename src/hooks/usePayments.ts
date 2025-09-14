'use client';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

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

  const getPaymentStatus = (client: any) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se tem status manual definido
    if (client.paymentStatus === 'paid') {
      // Verifica se o pagamento foi neste mês
      if (client.lastPaymentDate) {
        const paymentDate = new Date(client.lastPaymentDate);
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
          return 'paid';
        }
      }
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