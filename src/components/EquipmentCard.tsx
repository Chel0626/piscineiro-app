import React from 'react';
import { Equipment, MaintenanceEvent } from './ClientDashboard';

interface EquipmentCardProps {
  equipment: Equipment;
  onRegisterMaintenance: () => void;
}

function getProgressColor(monthsLeft: number) {
  if (monthsLeft > 6) return 'bg-green-500';
  if (monthsLeft > 3) return 'bg-yellow-500';
  return 'bg-red-500';
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onRegisterMaintenance }) => {
  // Calcular meses até próxima troca
  const monthsLeft = (() => {
    const next = new Date(equipment.next_change_forecast);
    const now = new Date();
    const diff = (next.getFullYear() - now.getFullYear()) * 12 + (next.getMonth() - now.getMonth());
    return diff;
  })();

  return (
    <div className="border rounded p-4 shadow-sm">
      <div className="font-semibold mb-2">Status do Equipamento</div>
      <div>Filtro: {equipment.filter_model}</div>
      <div>Areia: {equipment.sand_capacity_kg}kg</div>
      <div>
        Próxima troca: <span className="font-bold">{equipment.next_change_forecast}</span>
      </div>
      <div className="w-full h-2 rounded bg-gray-200 my-2">
        <div className={`h-2 rounded ${getProgressColor(monthsLeft)}`} style={{ width: `${Math.max(0, Math.min(100, monthsLeft * 5))}%` }} />
      </div>
      <div className="text-xs mb-2">
        {monthsLeft > 6 && <span className="text-green-700">OK</span>}
        {monthsLeft <= 6 && monthsLeft > 3 && <span className="text-yellow-700">Atenção</span>}
        {monthsLeft <= 3 && <span className="text-red-700">Troca Imediata</span>}
      </div>
      <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={onRegisterMaintenance}>
        Registrar Troca
      </button>
      <div className="mt-4">
        <div className="font-semibold mb-1">Histórico de Manutenção</div>
        <ul className="text-sm max-h-32 overflow-y-auto">
          {equipment.maintenance_history.slice(0, 3).map((event, idx) => (
            <li key={idx} className="mb-1">
              {event.date}: {event.type === 'sand_change' ? 'Troca de Areia' : event.type === 'crepina_change' ? 'Troca de Crepina' : 'Manutenção Válvula'}
              {event.notes && <span className="text-gray-500"> — {event.notes}</span>}
            </li>
          ))}
        </ul>
        <button className="mt-2 px-3 py-1 bg-gray-200 rounded">Ver tudo</button>
      </div>
    </div>
  );
};
