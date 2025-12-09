import React, { useState } from 'react';
import { Financial, PriceHistory } from './ClientDashboard';

interface FinancialCardProps {
  financial: Financial;
  onAdjustContract: () => void;
  onDeleteHistoryItem?: (index: number) => void;
  onSave: (financial: Financial) => void;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ financial, onAdjustContract, onDeleteHistoryItem, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Financial>(financial);

  // Inverter para mostrar o mais recente primeiro, mas manter o índice original para deleção
  const historyWithIndex = financial.reajusteHistory?.map((item, index) => ({ ...item, originalIndex: index })).reverse() || [];

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(financial);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded p-4 shadow-sm bg-white">
        <div className="font-semibold mb-4">Editar Contrato</div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequência</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              value={editData.frequency}
              onChange={(e) => setEditData({ ...editData, frequency: e.target.value as 'weekly' | 'biweekly' })}
            >
              <option value="weekly">1x por semana</option>
              <option value="biweekly">2x por semana</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Dia da Visita</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              value={editData.visit_day}
              onChange={(e) => setEditData({ ...editData, visit_day: e.target.value })}
            >
              <option value="">Selecione...</option>
              <option value="Segunda-feira">Segunda-feira</option>
              <option value="Terça-feira">Terça-feira</option>
              <option value="Quarta-feira">Quarta-feira</option>
              <option value="Quinta-feira">Quinta-feira</option>
              <option value="Sexta-feira">Sexta-feira</option>
              <option value="Sábado">Sábado</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 shadow-sm relative">
      <button 
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        onClick={() => {
          setEditData(financial);
          setIsEditing(true);
        }}
      >
        ✏️
      </button>
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
