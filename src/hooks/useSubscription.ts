import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isSuperAdmin } from '@/lib/userRoles';

export interface SubscriptionState {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  planId?: string;
  status?: string;
}

export function useSubscription(): SubscriptionState {
  const { user, authLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    hasActiveSubscription: false,
    isLoading: true,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ hasActiveSubscription: false, isLoading: false });
      return;
    }

    // Super Admin sempre tem acesso
    if (isSuperAdmin(user.uid)) {
      setState({
        hasActiveSubscription: true,
        isLoading: false,
        planId: 'super_admin',
        status: 'active'
      });
      return;
    }

    // Escutar mudanças no documento do usuário (onde salvaremos o status da assinatura)
    // Nota: Idealmente teríamos uma subcoleção 'subscriptions' ou similar, 
    // mas para simplificar vamos assumir campos no doc do usuário por enquanto
    // ou uma coleção separada 'subscriptions' linkada ao userId.
    // Vamos usar uma coleção 'subscriptions' onde o ID do documento é o UID do usuário.
    
    const subRef = doc(db, 'subscriptions', user.uid);
    
    const unsubscribe = onSnapshot(subRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const isActive = ['active', 'trialing'].includes(data.status);
        
        setState({
          hasActiveSubscription: isActive,
          isLoading: false,
          planId: data.planId,
          status: data.status
        });
      } else {
        // Sem documento de assinatura
        setState({
          hasActiveSubscription: false,
          isLoading: false
        });
      }
    }, (error) => {
      console.error("Erro ao buscar assinatura:", error);
      setState({ hasActiveSubscription: false, isLoading: false });
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return state;
}
