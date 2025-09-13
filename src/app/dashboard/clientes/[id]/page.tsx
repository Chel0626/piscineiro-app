'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useClientDetails } from '@/hooks/useClientDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ArrowLeft } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { AiHelper } from '@/components/AiHelper';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVisitSubmit = async (data: VisitFormData) => {
    if (!clientId) return;
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

      <Tabs defaultValue="history" className="w-full">
        <div className="relative w-full overflow-x-auto">
          <TabsList className="whitespace-nowrap">
            <TabsTrigger value="data">Dados Cadastrais</TabsTrigger>
            <TabsTrigger value="history">Histórico e Tratamento</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="ai_helper">Ajudante IA</TabsTrigger>
          </TabsList>
        </div>
        
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
          <div className="space-y-8">
            <ProductCalculator poolVolume={client.poolVolume} />
            
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nova Visita</CardTitle>
              </CardHeader>
              <CardContent>
                <VisitForm onSubmit={handleVisitSubmit} isLoading={isSubmitting} />
                
                <Separator className="my-8" />

                <h3 className="text-xl font-semibold mb-4">Visitas Anteriores</h3>
                <div className="space-y-4">
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <div key={visit.id} className="p-4 border rounded-md">
                        <p className="font-semibold text-md mb-2">
                          {visit.timestamp?.toDate().toLocaleDateString('pt-BR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                        <div className="flex gap-6 text-sm">
                          <span><strong>pH:</strong> {visit.ph}</span>
                          <span><strong>Cloro:</strong> {visit.cloro} ppm</span>
                          <span><strong>Alcalinidade:</strong> {visit.alcalinidade} ppm</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center text-gray-500 py-4">
                      Nenhum registro de visita encontrado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Necessários</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Em breve: Sistema de solicitação de produtos.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai_helper">
            {/* ✅ CORREÇÃO: Removemos a prop `clientId` que não existe mais */}
            <AiHelper poolVolume={client.poolVolume} />
        </TabsContent>

      </Tabs>
    </div>
  );
}