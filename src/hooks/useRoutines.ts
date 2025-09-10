import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ClientFormData } from '@/lib/validators/clientSchema';

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
    if (user) {
      const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...(doc.data() as ClientFormData) });
        });

        const grouped = clientsData.reduce((acc, client) => {
          const day = client.visitDay;
          if (!acc[day]) { acc[day] = []; }
          acc[day].push(client);
          return acc;
        }, {} as GroupedClients);

        setGroupedClients(grouped);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return { isLoading, groupedClients };
}