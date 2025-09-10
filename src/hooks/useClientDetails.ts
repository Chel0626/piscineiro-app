import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { VisitFormData } from '@/components/VisitForm';

// Tipos
export interface ClientData {
  name: string;
  address: string;
  neighborhood: string;
  phone: string;
  poolVolume: number;
  serviceValue: number;
  visitDay: string;
}

export interface Visit extends VisitFormData {
  id: string;
  timestamp: Timestamp;
}

export function useClientDetails() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientId) {
      const clientDocRef = doc(db, 'clients', clientId);
      const unsubscribe = onSnapshot(clientDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setClient(docSnap.data() as ClientData);
        } else {
          toast.error('Cliente não encontrado.');
          setClient(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      const q = query(visitsCollectionRef, orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const visitsData: Visit[] = [];
        querySnapshot.forEach((doc) => {
          visitsData.push({ id: doc.id, ...(doc.data() as Omit<Visit, 'id'>) });
        });
        setVisits(visitsData);
      });
      return () => unsubscribe();
    }
  }, [clientId]);

  const handleVisitSubmit = async (data: VisitFormData) => {
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, { ...data, timestamp: serverTimestamp() });
      toast.success('Visita registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível registrar a visita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    clientId,
    client,
    visits,
    isLoading,
    isSubmitting,
    handleVisitSubmit,
  };
}