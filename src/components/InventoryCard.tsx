import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  updated_at: string;
}

interface InventoryCardProps {
  inventory: InventoryItem[];
  onUpdate: (items: InventoryItem[]) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ inventory, onUpdate }) => {
  const [items, setItems] = useState<InventoryItem[]>(inventory);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  function handleChangeQty(id: string, delta: number) {
    const updated = items.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta), updated_at: new Date().toISOString().slice(0, 10) }
        : item
    );
    setItems(updated);
    onUpdate(updated);
  }

  function handleAddProduct() {
    if (!newName.trim()) return;
    const newItem: InventoryItem = {
      id: `prod_${Date.now()}`,
      name: newName,
      quantity: 1,
      unit: 'un',
      updated_at: new Date().toISOString().slice(0, 10),
    };
    const updated = [...items, newItem];
    setItems(updated);
    onUpdate(updated);
    setNewName('');
    setShowAdd(false);
  }

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg">Produtos no Local</span>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>+ Adicionar Novo Produto</Button>
      </div>
      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input className="border rounded px-2 py-1 text-sm" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do produto" />
          <Button size="sm" onClick={handleAddProduct}>Salvar</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
        </div>
      )}
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
            <span className={`flex-1 font-medium ${item.quantity === 0 ? 'text-red-600' : item.quantity === 1 ? 'text-orange-600' : 'text-gray-900'}`}>{item.name}</span>
            {item.quantity === 0 && <span className="text-xs text-red-600 flex items-center gap-1"><span>ESGOTADO</span> <span title="Esgotado">⚠️</span></span>}
            {item.quantity === 1 && <span className="text-xs text-orange-600">Acabando</span>}
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => handleChangeQty(item.id, -1)} disabled={item.quantity === 0}>-</Button>
              <span className="px-2 text-sm font-mono">{item.quantity} {item.unit}</span>
              <Button size="sm" variant="outline" onClick={() => handleChangeQty(item.id, 1)}>+</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
