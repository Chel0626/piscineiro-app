'use client';

import { useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'sonner';

export interface TemporaryReschedule {
  id: string;
  clientId: string;
  clientName: string;
  originalDay: string;
  newDay: string;
  userId: string;
  createdAt: Timestamp;
}

export function useTemporaryReschedule() {
  const [user] = useAuthState(auth);
  const [reschedules, setReschedules] = useState<TemporaryReschedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar reagendamentos temporários do usuário atual
  useEffect(() => {
    if (!user) {
      setReschedules([]);
      return;
    }

    const reschedulesRef = collection(db, 'temporary-reschedules');
    const q = query(reschedulesRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reschedulesData: TemporaryReschedule[] = [];
      snapshot.forEach((doc) => {
        reschedulesData.push({ id: doc.id, ...doc.data() } as TemporaryReschedule);
      });
      setReschedules(reschedulesData);
    }, (error) => {
      console.error('Erro ao carregar reagendamentos:', error);
      toast.error('Erro ao carregar reagendamentos temporários');
    });

    return unsubscribe;
  }, [user]);

  // Mover cliente para outro dia
  const rescheduleClient = async (
    clientId: string, 
    clientName: string, 
    originalDay: string, 
    newDay: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Verificar se o cliente já foi reagendado
    const existingReschedule = reschedules.find(r => r.clientId === clientId);
    if (existingReschedule) {
      toast.error('Este cliente já foi reagendado. Cada cliente pode ser movido apenas uma vez.');
      return false;
    }

    setIsLoading(true);
    try {
      const rescheduleId = `${user.uid}_${clientId}_${Date.now()}`;
      const rescheduleData: Omit<TemporaryReschedule, 'id'> = {
        clientId,
        clientName,
        originalDay,
        newDay,
        userId: user.uid,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'temporary-reschedules', rescheduleId), rescheduleData);
      toast.success(`${clientName} foi movido para ${newDay}`);
      return true;
    } catch (error) {
      console.error('Erro ao reagendar cliente:', error);
      toast.error('Erro ao reagendar cliente');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar reagendamento (voltar cliente ao dia original)
  const cancelReschedule = async (rescheduleId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'temporary-reschedules', rescheduleId));
      toast.success('Reagendamento cancelado');
      return true;
    } catch (error) {
      console.error('Erro ao cancelar reagendamento:', error);
      toast.error('Erro ao cancelar reagendamento');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se um cliente está reagendado
  const isClientRescheduled = (clientId: string): TemporaryReschedule | null => {
    return reschedules.find(r => r.clientId === clientId) || null;
  };

  // Obter clientes reagendados para um dia específico
  const getClientsForDay = (day: string): TemporaryReschedule[] => {
    return reschedules.filter(r => r.newDay === day);
  };

  // Verificar se cliente foi movido para fora do dia atual
  const isClientMovedAway = (clientId: string, currentDay: string): boolean => {
    const reschedule = reschedules.find(r => r.clientId === clientId);
    return reschedule ? reschedule.originalDay === currentDay : false;
  };

  return {
    reschedules,
    isLoading,
    rescheduleClient,
    cancelReschedule,
    isClientRescheduled,
    getClientsForDay,
    isClientMovedAway
  };
}