import React from 'react';
import { Financial } from './ClientDashboard';

interface AdjustContractModalProps {
  open: boolean;
  currentValue: number;
  onClose: () => void;
  onAdjust: (newValue: number, dateStart: string, reason: string) => void;
}

export const AdjustContractModal: React.FC<AdjustContractModalProps> = ({ open, currentValue, onClose, onAdjust }) => {
  const [newValue, setNewValue] = React.useState(currentValue);
  const [dateStart, setDateStart] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdjust(newValue, dateStart, reason);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded shadow-lg min-w-[300px] space-y-3" onSubmit={handleSubmit}>
        <div className="font-bold mb-2">Reajuste de Contrato</div>
        <div className="mb-2">Valor Atual: <span className="font-semibold">R$ {currentValue.toFixed(2)}</span></div>
        <div>
          <label className="block text-sm font-medium mb-1">Novo Valor (R$)</label>
          <input type="number" value={newValue} onChange={e => setNewValue(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de Vigência</label>
          <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Motivo</label>
          <input value={reason} onChange={e => setReason(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" className="px-3 py-1 bg-yellow-600 text-white rounded">Aplicar Reajuste</button>
          <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};
