'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { VisitFormData } from '@/components/VisitForm';

// Tipos de dados
interface ClientDetails extends ClientFormData {
  id: string;
}

interface Visit extends VisitFormData {
  id: string;
  timestamp: Timestamp;
}

export function useClientDetails(clientId: string | null) {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    // Listener para os dados do cliente
    const clientDocRef = doc(db, 'clients', clientId);
    const unsubscribeClient = onSnapshot(clientDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...(docSnap.data() as ClientFormData) });
      } else {
        toast.error('Cliente não encontrado.');
        setClient(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar detalhes do cliente:", error);
      toast.error('Não foi possível carregar os dados do cliente.');
      setIsLoading(false);
    });

    // Listener para o histórico de visitas
    const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
    const q = query(visitsCollectionRef, orderBy('timestamp', 'desc'));
    const unsubscribeVisits = onSnapshot(q, (querySnapshot) => {
      const visitsData: Visit[] = [];
      querySnapshot.forEach((doc) => {
        visitsData.push({ id: doc.id, ...(doc.data() as Omit<Visit, 'id'>) });
      });
      setVisits(visitsData);
    });

    // Função de limpeza para cancelar as inscrições
    return () => {
      unsubscribeClient();
      unsubscribeVisits();
    };
  }, [clientId]);

  return { client, visits, isLoading };
}