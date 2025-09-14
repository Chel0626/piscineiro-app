'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useClientProducts } from '@/hooks/useClientProducts';
import { PlusCircle, MinusCircle, ShoppingCart } from 'lucide-react';

export interface ProductUsage {
  productName: string;
  quantity: number;
}

interface VisitProductManagerProps {
  clientId: string;
  onProductsUsedChange: (products: ProductUsage[]) => void;
  onProductsRequestedChange: (products: ProductUsage[]) => void;
}

export function VisitProductManager({ 
  clientId, 
  onProductsUsedChange,
  onProductsRequestedChange 
}: VisitProductManagerProps) {
  const { products } = useClientProducts(clientId);
  const [productsUsed, setProductsUsed] = useState<ProductUsage[]>([]);
  const [productsRequested, setProductsRequested] = useState<ProductUsage[]>([]);

  const handleAddProductUsed = (productName: string) => {
    const existingProduct = productsUsed.find(p => p.productName === productName);
    if (existingProduct) {
      setProductsUsed(productsUsed.map(p => 
        p.productName === productName 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setProductsUsed([...productsUsed, { productName, quantity: 1 }]);
    }
    onProductsUsedChange([...productsUsed, { productName, quantity: 1 }]);
  };

  const handleAddProductRequested = (productName: string) => {
    const existingProduct = productsRequested.find(p => p.productName === productName);
    if (existingProduct) {
      setProductsRequested(productsRequested.map(p => 
        p.productName === productName 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setProductsRequested([...productsRequested, { productName, quantity: 1 }]);
    }
    onProductsRequestedChange([...productsRequested, { productName, quantity: 1 }]);
  };

  const handleRemoveProductUsed = (productName: string) => {
    const updatedProducts = productsUsed.filter(p => p.productName !== productName);
    setProductsUsed(updatedProducts);
    onProductsUsedChange(updatedProducts);
  };

  const handleRemoveProductRequested = (productName: string) => {
    const updatedProducts = productsRequested.filter(p => p.productName !== productName);
    setProductsRequested(updatedProducts);
    onProductsRequestedChange(updatedProducts);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Produtos Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">{product.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddProductUsed(product.name)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {productsUsed.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  {productsUsed.map((product) => (
                    <div key={product.productName} className="flex items-center justify-between">
                      <span className="text-sm">
                        {product.productName} (x{product.quantity})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProductUsed(product.productName)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Produtos a Solicitar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">{product.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddProductRequested(product.name)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {productsRequested.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  {productsRequested.map((product) => (
                    <div key={product.productName} className="flex items-center justify-between">
                      <span className="text-sm">
                        {product.productName} (x{product.quantity})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProductRequested(product.productName)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}