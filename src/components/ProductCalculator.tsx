'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { calculatorFormSchema, CalculatorFormData } from '@/lib/validators/calculatorSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ProductCalculatorProps {
  poolVolume: number; // Volume em m³
}

export function ProductCalculator({ poolVolume }: ProductCalculatorProps) {
  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
    },
  });

  // useWatch para observar as mudanças nos campos em tempo real
  const watchedValues = useWatch({ control: form.control });

  // Lógica de cálculo (regras simples conforme a documentação)
  const calcularProdutos = (data: Partial<CalculatorFormData>) => {
    const volumeLitros = poolVolume * 1000;
    let acoes = [];

    // Lógica para o Cloro
    const cloroAtual = data.cloro ?? 0;
    if (cloroAtual < 1) {
      const cloroNecessario = (volumeLitros / 1000) * 4; // 4g por m³
      acoes.push(`Adicionar ${cloroNecessario.toFixed(0)}g de cloro granulado para atingir o nível ideal (1-3 ppm).`);
    }

    // Lógica para o pH
    const phAtual = data.ph ?? 7.4;
    if (phAtual > 7.6) {
      const redutorNecessario = (volumeLitros / 1000) * 10; // 10ml por m³
      acoes.push(`Adicionar ${redutorNecessario.toFixed(0)}ml de redutor de pH para baixar o nível (ideal 7.2-7.6).`);
    } else if (phAtual < 7.2) {
      const elevadorNecessario = (volumeLitros / 1000) * 5; // 5g por m³
      acoes.push(`Adicionar ${elevadorNecessario.toFixed(0)}g de elevador de pH (barrilha) para aumentar o nível.`);
    }

    // Lógica para a Alcalinidade
    const alcalinidadeAtual = data.alcalinidade ?? 100;
    if (alcalinidadeAtual < 80) {
        const elevadorAlcalinidade = (volumeLitros / 1000) * 17; // 17g por m³
        acoes.push(`Adicionar ${elevadorAlcalinidade.toFixed(0)}g de elevador de alcalinidade para estabilizar o pH (ideal 80-120 ppm).`);
    }

    if (acoes.length === 0 && (data.cloro || data.ph || data.alcalinidade)) {
        return ["Parâmetros dentro do ideal. Apenas manutenção."];
    }

    return acoes;
  };

  const recomendacoes = calcularProdutos(watchedValues);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Produtos</CardTitle>
        <CardDescription>Insira os parâmetros atuais para calcular a dosagem.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pH</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="7.2" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cloro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cloro (ppm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="1.5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alcalinidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alcalinidade (ppm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="100" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <div className="mt-6">
            <h4 className="font-semibold mb-2">Recomendações:</h4>
            {recomendacoes.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {recomendacoes.map((rec, index) => <li key={index}>{rec}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">Aguardando parâmetros...</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}