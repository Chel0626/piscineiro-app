import React, { useState } from 'react';
import { CalculatorModal } from './CalculatorModal';
import { InventoryCard, InventoryItem } from './InventoryCard';

interface ClientOperationalPanelProps {
  poolVolume: number;
  clientName: string;
  inventory: InventoryItem[];
  onInventoryUpdate: (items: InventoryItem[]) => void;
}

export const ClientOperationalPanel: React.FC<ClientOperationalPanelProps> = ({ poolVolume, clientName, inventory, onInventoryUpdate }) => {
  const [showCalculator, setShowCalculator] = useState(false);

  return (
    <div className="space-y-4">
      <CalculatorModal open={showCalculator} onClose={() => setShowCalculator(false)} poolVolume={poolVolume} clientName={clientName} />

      {/* Botão de acesso rápido à calculadora */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
              🧪 Calculadora de Dosagem
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Calcule produtos químicos baseado nos parâmetros da água • Volume: {poolVolume}m³ ({poolVolume * 1000}L)
            </p>
          </div>
          <button
            onClick={() => setShowCalculator(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Abrir Calculadora
          </button>
        </div>
      </div>

      {/* Card de Estoque */}
      <InventoryCard inventory={inventory} onUpdate={onInventoryUpdate} />
    </div>
  );
};
