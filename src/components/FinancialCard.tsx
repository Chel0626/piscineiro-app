import React from 'react';
import { Financial, PriceHistory } from './ClientDashboard';

interface FinancialCardProps {
  financial: Financial;
  onAdjustContract: () => void;
  onDeleteHistoryItem?: (index: number) => void;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ financial, onAdjustContract, onDeleteHistoryItem }) => {
  // Inverter para mostrar o mais recente primeiro, mas manter o índice original para deleção
  const historyWithIndex = financial.reajusteHistory?.map((item, index) => ({ ...item, originalIndex: index })).reverse() || [];

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
          {historyWithIndex.length === 0 && <li className="text-gray-500 italic">Nenhum reajuste registrado.</li>}
          {historyWithIndex.map((h, idx) => (
            <li key={idx} className="mb-2 p-2 bg-gray-50 rounded flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {h.date ? new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '--/--/----'}
                </div>
                <div>
                  R$ {(h.oldValue ?? 0).toFixed(2)} ➝ <strong>R$ {(h.newValue ?? 0).toFixed(2)}</strong>
                </div>
                {h.reason && <div className="text-xs text-gray-500">{h.reason}</div>}
              </div>
              {onDeleteHistoryItem && (
                <button 
                  onClick={() => onDeleteHistoryItem(h.originalIndex)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir registro"
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
