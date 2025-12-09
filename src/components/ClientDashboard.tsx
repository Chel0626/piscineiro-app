import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { ClientProfileForm } from './ClientProfileForm';
import { EquipmentCard } from './EquipmentCard';
import { FinancialCard } from './FinancialCard';
import { RegisterMaintenanceModal } from './RegisterMaintenanceModal';
import { AdjustContractModal } from './AdjustContractModal';
import { ParametersChart } from './ParametersChart';

// Tipos baseados no JSON sugerido
export type ClientProfile = {
  name: string;
  address: string;
  phone: string;
  coordinates?: { lat: number; lng: number };
};

export type MaintenanceEvent = {
  date: string;
  type: 'sand_change' | 'crepina_change' | 'valve_maintenance';
  notes?: string;
};

export type Equipment = {
  filter_model: string;
  sand_capacity_kg: number;
  last_sand_change: string;
  next_change_forecast: string;
  maintenance_history: MaintenanceEvent[];
};

export type PriceHistory = {
  date_start: string;
  date_end?: string;
  value: number;
};

export type Financial = {
  current_value: number;
  frequency: 'weekly' | 'biweekly';
  visit_day: string;
  active_since: string;
  price_history: PriceHistory[];
  reajusteHistory?: any[];
};

export type ClientData = {
  id: string;
  profile: ClientProfile;
  equipment: Equipment;
  financial: Financial;
};

// Componente principal do dashboard do cliente

export const ClientDashboard: React.FC<{ client: ClientData }> = ({ client }) => {
  // Estados para modais e edição
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [clientData, setClientData] = useState<ClientData>(client);

  // Dados dinâmicos do Firestore
  const { client: clientDetails, visits, isLoading } = useClientDetails(client.id);

  // Atualização do perfil
  function handleSaveProfile(newProfile: ClientProfile) {
    setClientData(prev => ({ ...prev, profile: newProfile }));
    setShowEditProfile(false);
  }

  // Registrar manutenção
  async function handleRegisterMaintenance(event: MaintenanceEvent) {
    // ...existing code...
  }

  // Reajustar contrato
  async function handleAdjustContract(newValue: number, dateStart: string, reason: string) {
    if (!client.id) return;

    const oldValue = clientData.financial.current_value;
    const diffValue = newValue - oldValue;
    const diffPercent = oldValue !== 0 ? (diffValue / oldValue) * 100 : 0;

    // Extrair o índice de inflação do motivo se possível
    const inflationMatch = reason.match(/IPCA: ([\d.]+)%/);
    const inflationIndex = inflationMatch ? parseFloat(inflationMatch[1]) : null;

    const newHistoryItem = {
      date: dateStart,
      oldValue,
      newValue,
      diffValue,
      diffPercent,
      inflationIndex,
      reason
    };

    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, {
        serviceValue: newValue,
        reajusteHistory: arrayUnion(newHistoryItem)
      });

      // Atualizar estado local
      setClientData(prev => ({
        ...prev,
        financial: {
          ...prev.financial,
          current_value: newValue,
          active_since: dateStart,
          price_history: [
            { date_start: dateStart, value: newValue },
            ...prev.financial.price_history
          ]
        }
      }));

      toast.success('Contrato reajustado com sucesso!');
    } catch (error) {
      console.error("Erro ao reajustar contrato:", error);
      toast.error('Erro ao salvar reajuste.');
    }
  }

  async function handleDeleteHistoryItem(index: number) {
    if (!client.id || !clientData.financial.reajusteHistory) return;
    
    if (!confirm('Tem certeza que deseja excluir este registro de reajuste?')) return;

    try {
      // Como não temos ID único, vamos remover pelo índice filtrando o array original
      // O array no banco está em ordem cronológica (antigo -> novo)
      // O índice recebido aqui vem do FinancialCard que exibe o price_history
      // Precisamos garantir que estamos removendo o item correto.
      
      // O price_history exibido no card é derivado do reajusteHistory.
      // Se o card exibe em ordem reversa (novo -> antigo), precisamos ajustar o índice.
      // Mas o FinancialCard atual exibe price_history.slice(0, 3).
      // Se price_history foi construído como [novo, ...antigos] no handleAdjustContract, ele está reverso.
      // Mas no carregamento inicial (page.tsx), ele é map direto do reajusteHistory (antigo -> novo).
      
      // Vamos assumir que o usuário quer deletar o item que ele clicou.
      // Vamos passar o objeto completo para deletar, é mais seguro.
      // Mas o FinancialCard recebe PriceHistory, que é uma versão simplificada.
      
      // Melhor abordagem: Recarregar o array do banco, remover o item e salvar tudo de novo.
      const currentHistory = [...clientData.financial.reajusteHistory];
      
      // Se o índice for baseado na visualização reversa (se implementarmos assim no card), ajustamos.
      // Por enquanto, vamos assumir que o card vai passar o índice correto do array original.
      // VOU ALTERAR O FINANCIAL CARD PARA RECEBER O ARRAY COMPLETO E GERENCIAR A VISUALIZAÇÃO.
      
      const itemToDelete = currentHistory[index];
      const newHistory = currentHistory.filter((_, i) => i !== index);
      
      // Se deletarmos o último (que é o atual), precisamos reverter o valor do serviço para o anterior
      let newServiceValue = clientData.financial.current_value;
      if (index === currentHistory.length - 1) {
        // Estamos deletando o último reajuste, voltar para o valor anterior
        // O valor anterior está no item deletado como 'oldValue'
        newServiceValue = itemToDelete.oldValue;
      }

      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, {
        serviceValue: newServiceValue,
        reajusteHistory: newHistory
      });

      setClientData(prev => ({
        ...prev,
        financial: {
          ...prev.financial,
          current_value: newServiceValue,
          reajusteHistory: newHistory,
          price_history: newHistory.map(h => ({
            date_start: h.date,
            value: h.newValue
          }))
        }
      }));
      
      toast.success('Item removido com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover item.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header do Cliente */}
      <div className="flex items-center gap-4">
        {/* Avatar/Foto */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
          {clientData.profile.name[0]}
        </div>
        <div>
          <div className="font-semibold text-lg">{clientData.profile.name}</div>
          <div className="text-sm text-gray-600">{clientData.profile.address}</div>
        </div>
        {/* Ações rápidas */}
        <div className="ml-auto flex gap-2">
          <button title="WhatsApp" className="p-2 rounded bg-green-100 text-green-700">W</button>
          <button title="Ligar" className="p-2 rounded bg-blue-100 text-blue-700">L</button>
          <button title="Navegar" className="p-2 rounded bg-orange-100 text-orange-700">N</button>
        </div>
        <button className="ml-2 p-2 rounded bg-gray-100" title="Editar Perfil" onClick={() => setShowEditProfile(true)}>
          ✏️
        </button>
      </div>

      {/* Cards principais */}

      <div className="space-y-4">
        <EquipmentCard equipment={clientData.equipment} onRegisterMaintenance={() => setShowMaintenanceModal(true)} />
        <FinancialCard 
          financial={clientData.financial} 
          onAdjustContract={() => setShowAdjustModal(true)} 
          onDeleteHistoryItem={handleDeleteHistoryItem}
        />

        {/* Card: Histórico de Análises Químicas (dinâmico) */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="font-semibold text-base mb-1">
            {clientDetails?.name || clientData.profile.name} - {clientDetails?.address || clientData.profile.address}
          </div>
          <div className="text-sm text-gray-600 mb-2">Análise da Água</div>
          <hr className="mb-2" />
          {isLoading ? (
            <div className="text-xs text-gray-500">Carregando análises...</div>
          ) : visits.length === 0 ? (
            <div className="text-xs text-gray-500">Nenhuma análise registrada.</div>
          ) : (
            <>
              {/* Última análise */}
              <div className="mb-2">
                <div className="text-xs text-gray-500">
                  Última análise: {visits[0].timestamp && typeof visits[0].timestamp.toDate === 'function' ? visits[0].timestamp.toDate().toLocaleString('pt-BR') : '---'}
                </div>
                {visits[0].poolPhoto && (
                  <img src={visits[0].poolPhoto} alt="Foto da piscina" className="w-full max-w-xs rounded border my-2" />
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>pH: <span className="font-semibold">{visits[0].ph ?? '--'}</span></span>
                  <span className="text-green-600 font-medium">{visits[0].ph >= 7.2 && visits[0].ph <= 7.6 ? '✓ Ideal (7.2-7.6)' : 'Fora do ideal'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Cloro Livre: <span className="font-semibold">{visits[0].cloro ?? '--'} ppm</span></span>
                  <span className="text-green-600 font-medium">{visits[0].cloro >= 1 && visits[0].cloro <= 3 ? '✓ Bom (1.0-3.0)' : 'Fora do ideal'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Alcalinidade: <span className="font-semibold">{visits[0].alcalinidade ?? '--'} ppm</span></span>
                  <span className="text-green-600 font-medium">{visits[0].alcalinidade >= 80 && visits[0].alcalinidade <= 120 ? '✓ Ideal (80-120)' : 'Fora do ideal'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Condição da Água: <span className="font-semibold capitalize">{visits[0].waterCondition ?? '--'}</span></span>
                </div>
                {visits[0].description && (
                  <div className="text-xs text-gray-700 mt-1">Obs: {visits[0].description}</div>
                )}
              </div>
              <button 
                className="text-blue-600 text-xs underline mb-2"
                onClick={() => setShowChart(true)}
              >
                Ver Gráfico de Evolução
              </button>
              <hr className="my-2" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-xs text-gray-700 font-medium">Últimos 30 dias</span>
              </div>
              {/* Histórico simplificado */}
              <ul className="text-xs text-gray-600 space-y-1">
                {visits.slice(0, 5).map((v, idx) => (
                  <li key={v.id}>
                    • {v.timestamp && typeof v.timestamp.toDate === 'function' ? v.timestamp.toDate().toLocaleDateString('pt-BR') : '--'} - pH {v.ph ?? '--'}, Cloro {v.cloro ?? '--'}, Condição: <span className="capitalize">{v.waterCondition ?? '--'}</span>{v.poolPhoto ? ' 📷' : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
          <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-1 px-2 rounded text-xs mt-3">Registrar Nova Análise</button>
        </div>
      </div>

      {/* Modais de ação */}
      <RegisterMaintenanceModal
        open={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onRegister={handleRegisterMaintenance}
      />
      <AdjustContractModal
        open={showAdjustModal}
        currentValue={clientData.financial.current_value}
        lastAdjustmentDate={clientData.financial.active_since}
        onClose={() => setShowAdjustModal(false)}
        onAdjust={handleAdjustContract}
      />
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <ClientProfileForm profile={clientData.profile} onSave={handleSaveProfile} />
          <button className="absolute top-4 right-4 px-3 py-1 bg-gray-300 rounded" onClick={() => setShowEditProfile(false)}>Fechar</button>
        </div>
      )}
      
      {/* Gráfico de evolução dos parâmetros */}
      <ParametersChart
        clientId={client.id}
        isOpen={showChart}
        onClose={() => setShowChart(false)}
      />
    </div>
  );
};
