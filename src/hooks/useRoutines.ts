'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ClientFormData, LegacyClientData, migrateClientData } from '@/lib/validators/clientSchema';

// A definição desta interface era a provável causa do erro de parsing
interface Client extends ClientFormData {
  id: string;
}

interface GroupedClients {
  [day: string]: Client[];
}

export function useRoutines() {
  const [user] = useAuthState(auth);
  const [groupedClients, setGroupedClients] = useState<GroupedClients>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retorna imediatamente se não houver usuário, para evitar chamadas desnecessárias
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Verificar se é um cliente antigo e migrar se necessário
        let clientData: ClientFormData;
        if (data.visitDay && !data.visitDays) {
          // Migrar dados antigos
          clientData = migrateClientData(data as LegacyClientData);
        } else {
          clientData = data as ClientFormData;
        }
        
        clientsData.push({ id: doc.id, ...clientData });
      });

      const grouped = clientsData.reduce((acc, client) => {
        // Agora cada cliente pode ter múltiplos dias
        client.visitDays.forEach(day => {
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(client);
        });
        return acc;
      }, {} as GroupedClients);

      setGroupedClients(grouped);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar clientes para roteiros:", error);
      setIsLoading(false);
    });

    // Função de limpeza para cancelar a inscrição ao desmontar o componente
    return () => unsubscribe();
  }, [user]);

  return { groupedClients, isLoading };
}