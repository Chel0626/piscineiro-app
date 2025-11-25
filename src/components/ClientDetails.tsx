import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Visit {
  id: string;
  timestamp?: any;
  description?: string;
}

interface ClientDetailsProps {
  clientId: string;
  phone?: string;
  address?: string;
}

export function ClientDetails({ clientId, phone, address }: ClientDetailsProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true);
      const visitsRef = collection(db, 'clients', clientId, 'visits');
      const snapshot = await getDocs(visitsRef);
      const visitsList: Visit[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisits(visitsList);
      setLoading(false);
    }
    fetchVisits();
  }, [clientId]);

  return (
    <div className="mt-2 p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
      <div><strong>Telefone:</strong> {phone || 'Não informado'}</div>
      <div><strong>Endereço:</strong> {address || 'Não informado'}</div>
      {/* Histórico rápido de visitas */}
      <div className="mt-2">
        <strong>Últimas visitas:</strong>
        <ul className="list-disc ml-4">
          {loading ? (
            <li>Carregando...</li>
          ) : visits.length > 0 ? (
            visits.slice(0,3).map((visit) => (
              <li key={visit.id}>
                {visit.timestamp?.toDate?.() ? visit.timestamp.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida'} - {visit.description ? visit.description : 'Sem observações'}
              </li>
            ))
          ) : (
            <li>Nenhuma visita registrada</li>
          )}
        </ul>
      </div>
    </div>
  );
}