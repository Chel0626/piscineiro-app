'use client';

import { useParams } from 'next/navigation';

import { useClientDetails } from '@/hooks/useClientDetails';
import { ClientDashboard, ClientData } from '@/components/ClientDashboard';

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { client, isLoading } = useClientDetails(clientId);  if (isLoading) {
    return <div className="text-center p-6 text-sm sm:text-base">Carregando dados do cliente...</div>;
  }

  if (!client) {
    return <div className="text-center p-6 text-sm sm:text-base">Cliente não encontrado.</div>;
  }

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
      <ClientDashboard client={clientDashboardData} />
    </div>
  );
}