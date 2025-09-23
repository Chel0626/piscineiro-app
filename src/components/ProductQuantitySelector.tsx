'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, Minus, ShoppingCart } from 'lucide-react';

// Lista completa de produtos disponíveis
const allProducts = [
  'Pastilha de Cloro',
  'Clarificante Líquido',
  'Clarificante Gel',
  'Algicída',
  'Elevador de Alcalinidade',
  'Redutor de pH',
  'Limpa Bordas',
  'Peróxido',
  'Tratamento Semanal',
  'Sulfato de Alumínio',
];

export interface ProductWithQuantity {
  name: string;
  quantity: number;
}

interface ProductQuantitySelectorProps {
  onProductsChange: (products: ProductWithQuantity[]) => void;
  className?: string;
}

export function ProductQuantitySelector({ onProductsChange, className = '' }: ProductQuantitySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  // Calcular produtos selecionados como array
  const selectedProductsArray = Object.entries(selectedProducts)
    .filter(([, quantity]) => quantity > 0)
    .map(([name, quantity]) => ({ name, quantity }));

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onProductsChange(selectedProductsArray);
  }, [selectedProductsArray, onProductsChange]);

  const updateQuantity = (productName: string, newQuantity: number) => {
    setSelectedProducts(prev => {
      const updated = { ...prev };
      if (newQuantity <= 0) {
        delete updated[productName];
      } else {
        updated[productName] = newQuantity;
      }
      return updated;
    });
  };

  const incrementQuantity = (productName: string) => {
    const currentQuantity = selectedProducts[productName] || 0;
    updateQuantity(productName, currentQuantity + 1);
  };

  const decrementQuantity = (productName: string) => {
    const currentQuantity = selectedProducts[productName] || 0;
    updateQuantity(productName, Math.max(0, currentQuantity - 1));
  };

  const getTotalItems = () => {
    return selectedProductsArray.reduce((sum, product) => sum + product.quantity, 0);
  };

  const getSelectedProductsText = () => {
    if (selectedProductsArray.length === 0) {
      return 'Nenhum produto selecionado';
    }
    
    if (selectedProductsArray.length === 1) {
      const product = selectedProductsArray[0];
      return `${product.name} (${product.quantity})`;
    }

    return `${selectedProductsArray.length} produtos selecionados (${getTotalItems()} itens)`;
  };

  return (
    <div className={className}>
      {/* Caixa de texto com botão expandir */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              readOnly
              value={getSelectedProductsText()}
              placeholder="Clique para selecionar produtos"
              className="cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3"
          >
            <ShoppingCart className="h-4 w-4" />
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Lista expandida de produtos */}
        {isExpanded && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">
                  Selecione os produtos e quantidades:
                </h4>
                
                {allProducts.map((product) => {
                  const quantity = selectedProducts[product] || 0;
                  
                  return (
                    <div
                      key={product}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        quantity > 0
                          ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${
                          quantity > 0 
                            ? 'text-purple-800 dark:text-purple-200' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {product}
                        </span>
                        {quantity > 0 && (
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            Quantidade: {quantity}
                          </div>
                        )}
                      </div>

                      {/* Seletor de quantidade */}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => decrementQuantity(product)}
                          disabled={quantity === 0}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <div className="w-8 text-center">
                          <span className="text-sm font-medium">
                            {quantity}
                          </span>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => incrementQuantity(product)}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Resumo */}
                {selectedProductsArray.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        <strong>Resumo:</strong> {selectedProductsArray.length} produtos diferentes, {getTotalItems()} itens no total
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}