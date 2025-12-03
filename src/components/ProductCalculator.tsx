'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculatorFormSchema, CalculatorFormData } from '@/lib/validators/calculatorSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ProductCalculatorProps {
  poolVolume?: number; // Volume em m³
  onProductsSelected?: (products: ProductSuggestion[]) => void;
}

export function ProductCalculator({ poolVolume, onProductsSelected }: ProductCalculatorProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  const calcularProdutos = (data: Partial<CalculatorFormData>): ProductSuggestion[] => {
    const volume = poolVolume || 0;
    const suggestions: ProductSuggestion[] = [];

    // NOVOS CÁLCULOS CONFORME ESPECIFICAÇÃO

    // 1. CLORO GRANULADO - Meta: 3ppm
    const cloroAtual = data.cloro ?? 0;
    if (cloroAtual < 3.0) {
      const cloroFaltante = 3.0 - cloroAtual;
      const cloroNecessario = 4 * volume * cloroFaltante;
      suggestions.push({
        id: 'cloro-granulado',
        name: 'Cloro Granulado',
        quantity: Math.round(cloroNecessario),
        unit: 'g'
      });
    }

    // Oxidação de choque se cloro está zerado
    if (cloroAtual === 0) {
      const choqueOxidacao = volume * 20;
      suggestions.push({
        id: 'cloro-choque',
        name: 'Cloro Granulado (Choque)',
        quantity: Math.round(choqueOxidacao),
        unit: 'g'
      });
    }

    // 2. ELEVADOR DE ALCALINIDADE - Meta: 12
    const alcalinidadeAtual = data.alcalinidade ?? 12;
    if (alcalinidadeAtual < 12) {
      const alcalinidadeFaltante = 12 - alcalinidadeAtual;
      const elevadorAlcalinidadeGramas = 17 * volume * alcalinidadeFaltante;
      const elevadorAlcalinidadeKg = elevadorAlcalinidadeGramas / 1000;
      suggestions.push({
        id: 'elevador-alcalinidade',
        name: 'Elevador de Alcalinidade',
        quantity: parseFloat(elevadorAlcalinidadeKg.toFixed(2)),
        unit: 'kg'
      });
    }

    // 3. REDUTOR DE pH
    const phAtual = data.ph ?? 7.4;
    if (phAtual > 7.6) {
      const redutorPh = volume * 10;
      suggestions.push({
        id: 'redutor-ph',
        name: 'Redutor de pH',
        quantity: Math.round(redutorPh),
        unit: 'ml'
      });
    }

    // 4. PRODUTOS COMPLEMENTARES
    const algicida = volume * 6;
    suggestions.push({
      id: 'algicida',
      name: 'Algicida',
      quantity: Math.round(algicida),
      unit: 'ml'
    });

    const sulfatoAluminio = volume * 40;
    suggestions.push({
      id: 'sulfato-aluminio',
      name: 'Sulfato de Alumínio',
      quantity: Math.round(sulfatoAluminio),
      unit: 'g'
    });

    const clarificanteManutencao = volume * 1.5;
    suggestions.push({
      id: 'clarificante-manutencao',
      name: 'Clarificante (manutenção)',
      quantity: parseFloat(clarificanteManutencao.toFixed(1)),
      unit: 'ml'
    });

    const clarificanteDecantacao = volume * 6;
    suggestions.push({
      id: 'clarificante-decantacao',
      name: 'Clarificante (decantação)',
      quantity: Math.round(clarificanteDecantacao),
      unit: 'ml'
    });

    return suggestions;
  };

  const recomendacoes = calcularProdutos(watchedValues);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      
      // Notificar produtos selecionados
      if (onProductsSelected) {
        const selected = recomendacoes.filter(p => newSet.has(p.id));
        onProductsSelected(selected);
      }
      
      return newSet;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Produtos</CardTitle>
  <CardDescription>Insira os parâmetros atuais para calcular a dosagem.<br />
  <strong>Metas:</strong> pH 7.2–7.6 | Cloro 3.0 ppm | Alcalinidade 120 ppm
  </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => {
                  const phValues = [6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0];
                  const currentIndex = phValues.indexOf(Number(field.value)) >= 0 ? phValues.indexOf(Number(field.value)) : 3;
                  return (
                    <FormItem>
                      <FormLabel>pH</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(phValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{phValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(phValues[Math.min(phValues.length - 1, currentIndex + 1)])} disabled={currentIndex === phValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="cloro"
                render={({ field }) => {
                  const cloroValues = [0, 1, 2, 3, 4];
                  const currentIndex = cloroValues.indexOf(Number(field.value)) >= 0 ? cloroValues.indexOf(Number(field.value)) : 0;
                  return (
                    <FormItem>
                      <FormLabel>Cloro (ppm)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(cloroValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{cloroValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(cloroValues[Math.min(cloroValues.length - 1, currentIndex + 1)])} disabled={currentIndex === cloroValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="alcalinidade"
                render={({ field }) => {
                  // Alcalinidade de 0 até 200, de 10 em 10
                  const alcalinidadeValues = Array.from({ length: 21 }, (_, i) => i * 10);
                  const currentIndex = alcalinidadeValues.indexOf(Number(field.value)) >= 0 ? alcalinidadeValues.indexOf(Number(field.value)) : 8; // default 80
                  return (
                    <FormItem>
                      <FormLabel>Alcalinidade (ppm)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                          <span className="min-w-[40px] text-center font-mono text-lg">{alcalinidadeValues[currentIndex]}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.min(alcalinidadeValues.length - 1, currentIndex + 1)])} disabled={currentIndex === alcalinidadeValues.length - 1}>+</Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
          </form>
        </Form>
        <div className="mt-6">
            <h4 className="font-semibold mb-3">Recomendações de Produtos:</h4>
            {recomendacoes.length > 0 ? (
                <div className="space-y-2">
                    {recomendacoes.map((produto) => (
                      <div key={produto.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Checkbox
                          id={produto.id}
                          checked={selectedProducts.has(produto.id)}
                          onCheckedChange={() => handleProductToggle(produto.id)}
                          className="h-5 w-5"
                        />
                        <label htmlFor={produto.id} className="flex-1 text-sm font-medium cursor-pointer">
                          {produto.name}: <span className="font-bold text-blue-600">{produto.quantity}{produto.unit}</span>
                        </label>
                      </div>
                    ))}
                    {selectedProducts.size > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✓ {selectedProducts.size} produto(s) selecionado(s) para abater do estoque
                      </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Aguardando parâmetros...</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}