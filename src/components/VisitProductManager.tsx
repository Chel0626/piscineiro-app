'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useClientProducts } from '@/hooks/useClientProducts';
import { PlusCircle, MinusCircle, ShoppingCart, Mail } from 'lucide-react';
import { toast } from 'sonner';

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
  const { client } = useClientDetails(clientId);
  const [productsUsed, setProductsUsed] = useState<ProductUsage[]>([]);
  const [productsRequested, setProductsRequested] = useState<ProductUsage[]>([]);

  const handleSendWhatsApp = () => {
    if (!client?.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }

    if (productsRequested.length === 0) {
      toast.error('Nenhum produto foi solicitado.');
      return;
    }

    const productsList = productsRequested
      .map(product => `- ${product.productName} (${product.quantity} unidades)`)
      .join('\n');

    const message = `Olá, ${client.name}! Tudo bem?\n\nSegue lista de produtos necessários para próxima visita, devo levar ou você providencia?\n\n${productsList}\n\nAguardo seu retorno!`;
    
    // Remove caracteres não numéricos do telefone
    const phoneNumber = client.phone.replace(/\D/g, '');
    
    // Usa wa.me para abrir no WhatsApp Web ou whatsapp:// para abrir no app
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com a mensagem!');
  };

  const handleSendEmail = () => {
    if (!client?.email) {
      toast.error('Cliente não possui email cadastrado.');
      return;
    }

    if (productsRequested.length === 0) {
      toast.error('Nenhum produto foi solicitado.');
      return;
    }

    const productsList = productsRequested
      .map(product => `- ${product.productName} (${product.quantity} unidades)`)
      .join('\\n');

    const subject = 'Lista de Produtos Necessários';
    const body = `Olá, ${client.name}! Tudo bem?\n\nSegue lista de produtos necessários para próxima visita, devo levar ou você providencia?\n\n${productsList}\n\nAguardo seu retorno!`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast.success('Email aberto no seu cliente de email padrão!');
  };

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
                <div className="space-y-4">
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

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleSendEmail}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar por Email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleSendWhatsApp}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Enviar no WhatsApp
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}