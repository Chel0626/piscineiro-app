import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { User } from 'firebase/auth'; // Importar o tipo User

interface Client extends ClientFormData {
  id: string;
}

interface GroupedClients {
  [day: string]: Client[];
}

// O hook agora recebe o usuário como um argumento
export function useRoutines(user: User | null | undefined) {
  const [groupedClients, setGroup-edClients] = useState<GroupedClients>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // A lógica agora depende do 'user' que veio como parâmetro
    if (user) {
      setIsLoading(true);
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
      // Se não há usuário, não há o que carregar
      setGroupedClients({});
      setIsLoading(false);
    }
  }, [user]); // O efeito depende da mudança do usuário

  return { isLoading, groupedClients };
}