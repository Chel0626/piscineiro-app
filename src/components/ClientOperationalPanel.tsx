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

      {/* Card de Estoque */}
      <InventoryCard inventory={inventory} onUpdate={onInventoryUpdate} />
    </div>
  );
};
