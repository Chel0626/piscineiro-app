'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ArrowLeft } from 'lucide-react';

// Tipos de dados
interface ClientData {
  name: string;
  address: string;
  neighborhood: string;
  phone: string;
  poolVolume: number;
  serviceValue: number;
  visitDay: string;
}

interface Visit extends VisitFormData {
  id: string;
  timestamp: Timestamp;
}

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<ClientData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientId) {
      const fetchClientData = async () => {
        setIsLoading(true);
        const clientDocRef = doc(db, 'clients', clientId);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          setClient(clientDocSnap.data() as ClientData);
        } else {
          toast.error('Cliente não encontrado.');
        }
        setIsLoading(false);
      };
      fetchClientData();
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
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      toast.success('Visita registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível registrar a visita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="text-center p-10">Cliente não encontrado.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/clientes" className="p-2 rounded-md hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">{client.name}</h1>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="history">Histórico de Visitas</TabsTrigger>
          <TabsTrigger value="products">Produtos Necessários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data">
          <Card>
            <CardHeader><CardTitle>Informações do Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p>{`${client.address}, ${client.neighborhood}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefone</p>
                  <p>{client.phone || 'Não cadastrado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Dia da Visita</p>
                  <p>{client.visitDay}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor do Contrato (R$)</p>
                  <p>{client.serviceValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Volume da Piscina (m³)</p>
                  <p>{client.poolVolume} m³</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nova Visita</CardTitle>
            </CardHeader>
            <CardContent>
              <VisitForm onSubmit={handleVisitSubmit} isLoading={isSubmitting} />