// src/components/ClientProductManager.tsx
'use client';

import { useState } from 'react';
import { useClientProducts } from '@/hooks/useClientProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

export function ClientProductManager({ clientId }: { clientId: string }) {
  const { products, isLoading, addProduct, updateProductQuantity, deleteProduct } = useClientProducts(clientId);
  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);

  const handleAddProduct = () => {
    if (newProductName.trim() === '' || newProductQuantity <= 0) {
      return;
    }
    addProduct(newProductName.trim(), newProductQuantity);
    setNewProductName('');
    setNewProductQuantity(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Produto</CardTitle>
          <CardDescription>Insira o nome e a quantidade do produto para adicionar ao estoque do cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nome do Produto (ex: Cloro Granulado)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Qtde."
              className="sm:w-24"
              value={newProductQuantity}
              onChange={(e) => setNewProductQuantity(Number(e.target.value))}
            />
            <Button onClick={handleAddProduct} className="flex-shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estoque do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando produtos...</p>
          ) : products.length > 0 ? (
            <ul className="space-y-3">
              {products.map(product => (
                <li key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, Number(e.target.value))}
                    />
                    <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-gray-500 py-4">Nenhum produto em estoque.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}