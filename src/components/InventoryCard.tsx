import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, Package } from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  updated_at: string;
}

// Produtos padrão pré-definidos com suas unidades
const STANDARD_PRODUCTS = [
  { name: 'Pastilha de Cloro', unit: 'unidades' },
  { name: 'Cloro', unit: 'gramas' },
  { name: 'Clarificante', unit: 'ml' },
  { name: 'Algicida Choque', unit: 'ml' },
  { name: 'Algicida Manutenção', unit: 'ml' },
  { name: 'Elevador de Alcalinidade', unit: 'gramas' },
  { name: 'Sulfato de Alumínio', unit: 'gramas' },
  { name: 'Elevador de pH', unit: 'ml' },
  { name: 'Barrilha', unit: 'gramas' },
  { name: 'Clarificante Gel', unit: 'unidades' },
  { name: 'Redutor de pH', unit: 'ml' },
];

interface InventoryCardProps {
  inventory: InventoryItem[];
  onUpdate: (items: InventoryItem[]) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ inventory, onUpdate }) => {
  const [items, setItems] = useState<InventoryItem[]>(inventory);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [customProductName, setCustomProductName] = useState('');
  const [customProductUnit, setCustomProductUnit] = useState('ml');
  const [customProductQty, setCustomProductQty] = useState(1);

  function handleChangeQty(id: string, delta: number) {
    const updated = items.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta), updated_at: new Date().toISOString().slice(0, 10) }
        : item
    );
    setItems(updated);
    onUpdate(updated);
  }

  function handleSetQty(id: string, newQty: number) {
    const updated = items.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, newQty), updated_at: new Date().toISOString().slice(0, 10) }
        : item
    );
    setItems(updated);
    onUpdate(updated);
  }

  function handleToggleProduct(productName: string) {
    setSelectedProducts(prev => ({
      ...prev,
      [productName]: {
        selected: !prev[productName]?.selected,
        quantity: prev[productName]?.quantity || 1
      }
    }));
  }

  function handleProductQtyChange(productName: string, quantity: number) {
    setSelectedProducts(prev => ({
      ...prev,
      [productName]: {
        ...prev[productName],
        quantity: Math.max(1, quantity)
      }
    }));
  }

  function handleAddProducts() {
    const newItems: InventoryItem[] = [];
    
    // Adicionar produtos selecionados
    Object.entries(selectedProducts).forEach(([name, data]) => {
      if (data.selected) {
        const product = STANDARD_PRODUCTS.find(p => p.name === name);
        if (product) {
          newItems.push({
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: product.name,
            quantity: data.quantity,
            unit: product.unit,
            updated_at: new Date().toISOString().slice(0, 10),
          });
        }
      }
    });

    // Adicionar produto customizado se preenchido
    if (customProductName.trim()) {
      newItems.push({
        id: `prod_${Date.now()}_custom`,
        name: customProductName.trim(),
        quantity: customProductQty,
        unit: customProductUnit,
        updated_at: new Date().toISOString().slice(0, 10),
      });
    }

    if (newItems.length > 0) {
      const updated = [...items, ...newItems];
      setItems(updated);
      onUpdate(updated);
      
      // Reset
      setSelectedProducts({});
      setCustomProductName('');
      setCustomProductQty(1);
      setShowAddModal(false);
    }
  }

  function handleRemoveProduct(id: string) {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onUpdate(updated);
  }

  // Calcular produtos com estoque baixo
  const lowStockCount = items.filter(item => item.quantity <= 1).length;

  return (
    <>
      <div className="bg-white rounded shadow p-4 mb-4 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-lg">Estoque de Produtos</span>
            {lowStockCount > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {lowStockCount} acabando
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produtos
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum produto no estoque</p>
            <p className="text-xs mt-1">Clique em &quot;Adicionar Produtos&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                item.quantity === 0 
                  ? 'bg-red-50 border-red-300' 
                  : item.quantity <= 1 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex-1 min-w-0">
                  <span className={`font-medium block truncate ${
                    item.quantity === 0 ? 'text-red-600' : item.quantity <= 1 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {item.name}
                  </span>
                  {item.quantity === 0 && (
                    <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <span>⚠️</span> ESGOTADO
                    </span>
                  )}
                  {item.quantity === 1 && (
                    <span className="text-xs text-orange-600 mt-1 block">Última unidade</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleChangeQty(item.id, -1)} 
                    disabled={item.quantity === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleSetQty(item.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center font-mono text-sm h-8"
                    min="0"
                  />
                  
                  <span className="text-sm text-gray-600 min-w-[60px]">{item.unit}</span>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleChangeQty(item.id, 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleRemoveProduct(item.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>💡 Dica: O estoque é automaticamente atualizado quando você registra visitas com produtos aplicados.</p>
        </div>
      </div>

      {/* Modal de Adicionar Produtos */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Produtos ao Estoque</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Produtos Padrão */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos Padrão
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {STANDARD_PRODUCTS.map((product) => (
                  <div key={product.name} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <Checkbox
                      checked={selectedProducts[product.name]?.selected || false}
                      onCheckedChange={() => handleToggleProduct(product.name)}
                    />
                    <span className="flex-1 font-medium text-sm">{product.name}</span>
                    <span className="text-xs text-gray-500 min-w-[80px]">({product.unit})</span>
                    {selectedProducts[product.name]?.selected && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProductQtyChange(
                            product.name, 
                            (selectedProducts[product.name]?.quantity || 1) - 1
                          )}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={selectedProducts[product.name]?.quantity || 1}
                          onChange={(e) => handleProductQtyChange(product.name, parseInt(e.target.value) || 1)}
                          className="w-16 text-center h-7 text-sm"
                          min="1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProductQtyChange(
                            product.name, 
                            (selectedProducts[product.name]?.quantity || 1) + 1
                          )}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Produto Customizado */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-sm mb-3">Produto Personalizado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label htmlFor="customName" className="text-xs">Nome do Produto</Label>
                  <Input
                    id="customName"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="Ex: Vitamina para Piscina"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="customUnit" className="text-xs">Unidade</Label>
                  <select
                    id="customUnit"
                    value={customProductUnit}
                    onChange={(e) => setCustomProductUnit(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"
                  >
                    <option value="ml">ml</option>
                    <option value="gramas">gramas</option>
                    <option value="unidades">unidades</option>
                    <option value="litros">litros</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="customQty" className="text-xs">Quantidade Inicial</Label>
                <Input
                  id="customQty"
                  type="number"
                  value={customProductQty}
                  onChange={(e) => setCustomProductQty(parseInt(e.target.value) || 1)}
                  min="1"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProducts}>
                Adicionar Produtos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
