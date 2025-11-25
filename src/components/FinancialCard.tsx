import React from 'react';
import { Financial, PriceHistory } from './ClientDashboard';

interface FinancialCardProps {
  financial: Financial;
  onAdjustContract: () => void;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ financial, onAdjustContract }) => {
  return (
    <div className="border rounded p-4 shadow-sm">
      <div className="font-semibold mb-2">Contrato Atual</div>
      <div className="text-2xl font-bold text-green-700">R$ {financial.current_value.toFixed(2)}</div>
      <div>Frequência: {financial.frequency === 'weekly' ? '1x por semana' : '2x por semana'}</div>
      <div>Dia da visita: {financial.visit_day}</div>
      <div>Vigente desde: {financial.active_since}</div>
      <button className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded" onClick={onAdjustContract}>
        Reajustar Valor
      </button>
      <div className="mt-4">
        <div className="font-semibold mb-1">Histórico de Preços</div>
        <ul className="text-sm max-h-32 overflow-y-auto">
          {financial.price_history.slice(0, 3).map((ph, idx) => (
            <li key={idx} className="mb-1">
              {ph.date_start} até {ph.date_end || 'atual'}: R$ {ph.value.toFixed(2)}
            </li>
          ))}
        </ul>
        <button className="mt-2 px-3 py-1 bg-gray-200 rounded">Ver tudo</button>
      </div>
    </div>
  );
};
