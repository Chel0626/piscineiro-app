import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ClienteAvulso {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  tipoServico: string;
  valor: number;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  descricaoServico?: string;
  fotoUrl?: string;
  timestamp: Timestamp;
  mes: string; // YYYY-MM para faturamento
}

export function useClientesAvulsos() {
  const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clientesAvulsosRef = collection(db, 'clientes-avulsos');
    const q = query(clientesAvulsosRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientesData: ClienteAvulso[] = [];
      snapshot.forEach((doc) => {
        clientesData.push({
          id: doc.id,
          ...doc.data(),
        } as ClienteAvulso);
      });
      setClientesAvulsos(clientesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { clientesAvulsos, isLoading };
}

// Hook para buscar clientes avulsos de um mês específico (para faturamento)
export function useClientesAvulsosMes(mes: string) {
  const [clientesAvulsos, setClientesAvulsos] = useState<ClienteAvulso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mes) {
      setClientesAvulsos([]);
      setIsLoading(false);
      return;
    }

    const clientesAvulsosRef = collection(db, 'clientes-avulsos');
    const q = query(
      clientesAvulsosRef,
      where('mes', '==', mes),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientesData: ClienteAvulso[] = [];
      snapshot.forEach((doc) => {
        clientesData.push({
          id: doc.id,
          ...doc.data(),
        } as ClienteAvulso);
      });
      setClientesAvulsos(clientesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [mes]);

  return { clientesAvulsos, isLoading };
}