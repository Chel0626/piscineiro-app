import React, { useState } from 'react';
import { CalculatorModal } from './CalculatorModal';
import { InventoryCard, InventoryItem } from './InventoryCard';
import { Button } from '@/components/ui/button';

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
      {/* Card de chamada da calculadora */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-bold text-lg flex items-center gap-2">
            <span>Calculadora de Dosagem</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Configurada para {poolVolume * 1000}L</span>
          </div>
          <div className="text-sm text-gray-600">Use a calculadora já configurada para este cliente.</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCalculator(true)}>
          <span role="img" aria-label="calculadora">🧪</span> Abrir Calculadora
        </Button>
      </div>
      <CalculatorModal open={showCalculator} onClose={() => setShowCalculator(false)} poolVolume={poolVolume} clientName={clientName} />

      {/* Card de Estoque */}
      <InventoryCard inventory={inventory} onUpdate={onInventoryUpdate} />
    </div>
  );
};
