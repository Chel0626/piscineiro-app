import React, { useState } from 'react';
import { ClientProfileForm } from './ClientProfileForm';
import { EquipmentCard } from './EquipmentCard';
import { FinancialCard } from './FinancialCard';
import { RegisterMaintenanceModal } from './RegisterMaintenanceModal';
import { AdjustContractModal } from './AdjustContractModal';

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
  const [clientData, setClientData] = useState<ClientData>(client);

  // Atualização do perfil
  function handleSaveProfile(newProfile: ClientProfile) {
    setClientData(prev => ({ ...prev, profile: newProfile }));
    setShowEditProfile(false);
  }

  // Registrar manutenção
  function handleRegisterMaintenance(event: MaintenanceEvent) {
    // Atualiza last_sand_change e next_change_forecast se for troca de areia
    const updatedEquipment = { ...clientData.equipment };
    if (event.type === 'sand_change') {
      updatedEquipment.last_sand_change = event.date;
      // Próxima troca: +18 meses
      const lastDate = new Date(event.date);
      lastDate.setMonth(lastDate.getMonth() + 18);
      updatedEquipment.next_change_forecast = lastDate.toISOString().slice(0, 10);
    }
    updatedEquipment.maintenance_history = [event, ...updatedEquipment.maintenance_history];
    setClientData(prev => ({ ...prev, equipment: updatedEquipment }));
  }

  // Reajustar contrato
  function handleAdjustContract(newValue: number, dateStart: string, reason: string) {
    // Move valor atual para price_history
    const prevValue = clientData.financial.current_value;
    const prevStart = clientData.financial.active_since;
    const newHistory: PriceHistory = {
      date_start: prevStart,
      date_end: dateStart,
      value: prevValue,
    };
    setClientData(prev => ({
      ...prev,
      financial: {
        ...prev.financial,
        current_value: newValue,
        active_since: dateStart,
        price_history: [newHistory, ...prev.financial.price_history],
      },
    }));
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
        <FinancialCard financial={clientData.financial} onAdjustContract={() => setShowAdjustModal(true)} />
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
        onClose={() => setShowAdjustModal(false)}
        onAdjust={handleAdjustContract}
      />
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <ClientProfileForm profile={clientData.profile} onSave={handleSaveProfile} />
          <button className="absolute top-4 right-4 px-3 py-1 bg-gray-300 rounded" onClick={() => setShowEditProfile(false)}>Fechar</button>
        </div>
      )}
    </div>
  );
};
