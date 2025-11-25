'use client';

import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useClientDetails } from '@/hooks/useClientDetails';
import { ClientDashboard, ClientData } from '@/components/ClientDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ClientProductManager } from '@/components/ClientProductManager';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const { client, visits, isLoading } = useClientDetails(clientId);
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteVisit = async (visitId: string) => {
    if (!clientId) return;
    setIsDeleting(visitId);
    try {
      const visitDocRef = doc(db, 'clients', clientId, 'visits', visitId);
      await deleteDoc(visitDocRef);
      toast.success('Visita deletada com sucesso!');
    // Transformar dados do client para o formato do dashboard
    const clientDashboardData: ClientData = {
      id: clientId,
      profile: {
        name: client.name,
        address: client.address,
        phone: client.phone || '',
        coordinates: undefined, // Adapte se houver dados
      },
      equipment: {
        filter_model: client.filterModel || '',
        sand_capacity_kg: client.filterSandKg || 0,
        last_sand_change: client.lastSandChange || '',
        next_change_forecast: client.nextSandChange || '',
        maintenance_history: [], // Adapte se houver histórico
      },
      financial: {
        current_value: client.serviceValue || 0,
        frequency: client.visitFrequency || 'weekly',
        visit_day: client.visitDays?.[0] || '',
        active_since: '', // Adapte se houver data
        price_history: [], // Adapte se houver histórico
      },
    };

    // Renderiza o novo dashboard
    return (
      <div className="p-2 sm:p-4">
        {/*
        FORMULÁRIO ANTIGO E TABS COMENTADOS PARA TESTE DO NOVO DASHBOARD
        */}
        <ClientDashboard client={clientDashboardData} />
      </div>
    );
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com o relatório da visita!');
  };

  if (isLoading) {
    return <div className="text-center p-6 text-sm sm:text-base">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="text-center p-6 text-sm sm:text-base">Cliente não encontrado.</div>;
  }

  // Transformar dados do client para o formato do dashboard
  const clientDashboardData: ClientData = {
    id: clientId,
    profile: {
      name: (client as NonNullable<typeof client>).name,
      address: (client as NonNullable<typeof client>).address,
      phone: (client as NonNullable<typeof client>).phone || '',
      coordinates: undefined, // Adapte se houver dados
    },
    equipment: {
      filter_model: (client as NonNullable<typeof client>).filterModel || '',
      sand_capacity_kg: (client as NonNullable<typeof client>).filterSandKg || 0,
      last_sand_change: (client as NonNullable<typeof client>).lastSandChange || '',
      next_change_forecast: (client as NonNullable<typeof client>).nextSandChange || '',
      maintenance_history: [], // Adapte se houver histórico
    },
    financial: {
      current_value: (client as NonNullable<typeof client>).serviceValue || 0,
      frequency: (client as NonNullable<typeof client>).visitFrequency || 'weekly',
      visit_day: (client as NonNullable<typeof client>).visitDays?.[0] || '',
      active_since: '', // Adapte se houver data
      price_history: [], // Adapte se houver histórico
    },
  };

  // Renderiza o novo dashboard
  return (
    <div className="p-2 sm:p-4">
      {/*
      FORMULÁRIO ANTIGO E TABS COMENTADOS PARA TESTE DO NOVO DASHBOARD
      */}
      <ClientDashboard client={clientDashboardData} />
    </div>
  );
}