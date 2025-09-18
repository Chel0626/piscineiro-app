'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { UseFormReturn } from 'react-hook-form';
import { ProductCalculator } from './ProductCalculatorSimple';
import { VisitForm, VisitFormData } from './VisitForm';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ShoppingCart, CheckCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
// Importamos nosso tipo unificado
import { ClientFormData } from '@/lib/validators/clientSchema';

interface ClientFormProps {
  // O formulário e a função de submit agora usam o mesmo tipo
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
  clientId?: string; // Adicionar clientId opcional para os componentes filhos
}

export function ClientForm({ form, onSubmit, clientId }: ClientFormProps) {
  // Estados para o solicitar produtos
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>([
    'Pastilha de Cloro',
    'Clarificante Líquido', 
    'Clarificante Gel',
    'Algicída',
    'Elevador de Alcalinidade'
  ]);

  const handleVisitSubmit = (data: VisitFormData) => {
    // Implementar lógica de submit da visita
    console.log('Nova visita:', data);
  };

  const selectProduct = (product: string) => {
    setSelectedProducts(prev => [...prev, product]);
    setAvailableProducts(prev => prev.filter(p => p !== product));
  };

  const removeProduct = (product: string) => {
    setSelectedProducts(prev => prev.filter(p => p !== product));
    setAvailableProducts(prev => [...prev, product]);
  };

  const handleSendProductsWhatsApp = () => {
    const clientName = form.watch('name');
    const clientPhone = form.watch('phone');
    
    if (!clientName || !clientPhone || selectedProducts.length === 0) {
      toast.error('Preencha o nome, telefone e selecione pelo menos um produto');
      return;
    }

    let productsList = '';
    selectedProducts.forEach(product => {
      productsList += `• ${product}\n`;
    });

    const message = `Olá ${clientName}, tudo bem?\n\n` +
      `Preciso dos seguintes produtos para a próxima visita:\n\n` +
      `${productsList}\n` +
      `Devo levar ou você providencia?`;

    const phoneNumber = clientPhone?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Mensagem de produtos enviada!');
    } else {
      toast.error('Número de telefone inválido');
    }
  };

  return (
    <Form {...form}>
      <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} className="text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Grid responsivo: 1 coluna no mobile, 2 colunas no desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua das Flores, 123" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Bairro / Condomínio</FormLabel>
                <FormControl>
                  <Input placeholder="Condomínio Azul" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Telefone</FormLabel>
              <FormControl>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={field.value || ''}
                  unmask={true}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="(19) 99999-9999"
                  className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Grid responsivo para campos numéricos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="poolVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Volume da Piscina (m³)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="30" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value}
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Valor (R$)</FormLabel>
                <FormControl>
                   <Input 
                     type="number" 
                     placeholder="250" 
                     {...field} 
                     onChange={(e) => field.onChange(Number(e.target.value))}
                     value={field.value}
                     className="text-sm"
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <FormField
            control={form.control}
            name="visitFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Frequência de Visitas</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly" className="text-sm">1x por semana</SelectItem>
                    <SelectItem value="biweekly" className="text-sm">2x por semana</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visitDays"
            render={({ field }) => {
              const selectedFrequency = form.watch('visitFrequency');
              const maxDays = selectedFrequency === 'biweekly' ? 2 : 1;
              
              return (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {selectedFrequency === 'biweekly' ? 'Dias das Visitas (máximo 2)' : 'Dia da Visita'}
                  </FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day) => (
                      <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(day) || false}
                          onChange={(e) => {
                            const currentDays = field.value || [];
                            if (e.target.checked) {
                              if (currentDays.length < maxDays) {
                                field.onChange([...currentDays, day]);
                              }
                            } else {
                              field.onChange(currentDays.filter(d => d !== day));
                            }
                          }}
                          disabled={!field.value?.includes(day) && (field.value?.length || 0) >= maxDays}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm">{day.split('-')[0]}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentDueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Dia do Vencimento</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 10" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                  className="text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seções Expansivas */}
        <div className="mt-6 space-y-4">
          {/* Calculadora de Produtos */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-blue-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-blue-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                🧮 Calculadora de Produtos
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white">
              <ProductCalculator 
                poolVolume={form.watch('poolVolume')} 
              />
            </div>
          </details>

          {/* Registro de Nova Visita */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-green-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-green-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                📝 Registrar Nova Visita
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white">
              <VisitForm
                onSubmit={handleVisitSubmit}
                isLoading={false}
                clientId={clientId || ''}
              />
            </div>
          </details>

          {/* Solicitar Produtos */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-purple-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-purple-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                🛒 Solicitar Produtos
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white space-y-4">
              
              {/* Produtos Disponíveis */}
              {availableProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-purple-700">
                    Produtos Disponíveis:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableProducts.map((product) => (
                      <Button
                        key={product}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => selectProduct(product)}
                        className="text-left justify-start h-auto py-2 px-3 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                      >
                        <ShoppingCart className="h-3 w-3 mr-2 text-purple-600" />
                        {product}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos Selecionados */}
              {selectedProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-green-700">
                    Produtos Selecionados ({selectedProducts.length}):
                  </h4>
                  <div className="space-y-2">
                    {selectedProducts.map((product) => (
                      <div
                        key={product}
                        className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {product}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado vazio */}
              {availableProducts.length === 0 && selectedProducts.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Todos os produtos foram selecionados!</p>
                </div>
              )}

              {/* Resumo e Botão WhatsApp */}
              {(selectedProducts.length > 0 || availableProducts.length > 0) && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">
                      <strong>Selecionados:</strong> {selectedProducts.length} produtos
                    </p>
                  </div>
                  
                  {/* Botão WhatsApp para Produtos */}
                  {selectedProducts.length > 0 && (
                    <Button 
                      type="button"
                      onClick={handleSendProductsWhatsApp}
                      className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                      variant="default"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar Lista de Produtos via WhatsApp
                    </Button>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>
      </form>
    </Form>
  );
}