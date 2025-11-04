'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculatorFormSchema, CalculatorFormData } from '@/lib/validators/calculatorSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProductCalculatorProps {
  poolVolume?: number; // Volume em m³
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

  const watchedValues = useWatch({ control: form.control });

  const calcularProdutos = (data: Partial<CalculatorFormData>) => {
    const volume = poolVolume || 0;
    const acoes = [];

    // NOVOS CÁLCULOS CONFORME ESPECIFICAÇÃO

    // 1. CLORO GRANULADO - Meta: 3ppm
    const cloroAtual = data.cloro ?? 0;
    if (cloroAtual < 3.0) {
      const cloroFaltante = 3.0 - cloroAtual;
      const cloroNecessario = 4 * volume * cloroFaltante;
      acoes.push(`Cloro Granulado: ${cloroNecessario.toFixed(0)}g (meta: 3.0 ppm)`);
    }

    // Oxidação de choque se cloro está zerado
    if (cloroAtual === 0) {
      const choqueOxidacao = volume * 20;
      acoes.push(`Oxidação de Choque: ${choqueOxidacao.toFixed(0)}g de Cloro Granulado`);
    }

    // 2. ELEVADOR DE ALCALINIDADE - Meta: 12
    const alcalinidadeAtual = data.alcalinidade ?? 12;
    if (alcalinidadeAtual < 12) {
      const alcalinidadeFaltante = 12 - alcalinidadeAtual;
      const elevadorAlcalinidadeGramas = 17 * volume * alcalinidadeFaltante;
      const elevadorAlcalinidadeKg = elevadorAlcalinidadeGramas / 1000;
      acoes.push(`Elevador de Alcalinidade: ${elevadorAlcalinidadeKg.toFixed(2)}kg (meta: 12)`);
    }

    // 3. REDUTOR DE pH
    const phAtual = data.ph ?? 7.4;
    if (phAtual > 7.6) {
      const redutorPh = volume * 10;
      acoes.push(`Redutor de pH: ${redutorPh.toFixed(0)}ml`);
    }

    // 4. PRODUTOS COMPLEMENTARES
    const algicida = volume * 6;
    acoes.push(`Algicida (manutenção/choque): ${algicida.toFixed(0)}ml`);

    const sulfatoAluminio = volume * 40;
    acoes.push(`Sulfato de Alumínio: ${sulfatoAluminio.toFixed(0)}g`);

    const clarificanteManutencao = volume * 1.5;
    acoes.push(`Clarificante (manutenção): ${clarificanteManutencao.toFixed(1)}ml`);

    const clarificanteDecantacao = volume * 6;
    acoes.push(`Clarificante (decantação): ${clarificanteDecantacao.toFixed(0)}ml`);

    if (acoes.length === 0) {
      return ["Use as fórmulas de cálculo conforme necessário."];
    }

    return acoes;
  };

  const recomendacoes = calcularProdutos(watchedValues);

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