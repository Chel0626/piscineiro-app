'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useClientDetails } from '@/hooks/useClientDetails';
import { toast } from 'sonner';
import { Send, Clock, CheckSquare, ShoppingCart, Plus, Minus, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}


const formSchema = z.object({
  waterCondition: z.enum(['cristalina', 'turva', 'verde', 'leitosa', 'decantando'], { message: 'Selecione a condição da água.' }),
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  chlorineType: z.enum(['3-em-1', 'estabilizado', 'hipoclorito'], { message: 'Selecione o tipo de cloro.' }),
  daysUntilNext: z.coerce.number().min(1).max(30, { message: 'Dias até próxima manutenção deve ser entre 1 e 30.' }),
  productsUsed: z.string().optional(), // Ex: "Cloro 2L, Algicida 100ml"
  checklist: z.string().optional(), // Ex: "Escovação, Aspiração, Retrolavagem"
  productsToRequest: z.string().optional(), // Ex: "Pastilha de Cloro (5), Algicída (2)"
  description: z.string().optional(),
  departureTime: z.string().optional(),
});

type VisitFormData = z.infer<typeof formSchema>;

export type { VisitFormData };

interface VisitFormProps {
  onSubmit: (data: VisitFormData, structuredProducts?: ProductSuggestion[]) => void;
  isLoading: boolean;
  clientId: string;
  initialData?: Partial<VisitFormData>;
}

export function VisitForm({ onSubmit, isLoading, clientId, initialData }: VisitFormProps) {
  const { client } = useClientDetails(clientId);
  const [step, setStep] = useState(1);
  
  // Estado para produtos sugeridos e selecionados
  const [suggestedProducts, setSuggestedProducts] = useState<ProductSuggestion[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  
  // Estado para Checklist (agora integrado ao passo 3)
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  
  // Estado para Produtos a Solicitar (agora integrado ao passo 4)
  const [selectedProductsToRequest, setSelectedProductsToRequest] = useState<Record<string, number>>({});
  
  // Opções de processos disponíveis
  const processOptions = [
    'Aspiração',
    'Peneirar',
    'Escovar Paredes e Fundo',
    'Limpar Borda',
    'Limpeza de Pré-Filtro',
    'Retrolavagem da Areia'
  ];
  
  // Opções de produtos disponíveis para solicitar
  const productOptions = [
    'Balde de Cloro Estabilizado',
    'Balde de Cloro Hipocloríto',
    'Pastilha de Cloro',
    'Peróxido',
    'Tratamento Semanal',
    'Elevador de Alcalinidade',
    'Redutor de pH',
    'Algicida de Manutenção',
    'Algicida de Choque',
    'Clarificante Líquido',
    'Clarificante Gel',
    'Sulfato de Alumínio',
    'Barrilha',
  ];
  
  // Função para obter horário atual formatado
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const form = useForm<VisitFormData>({
    defaultValues: {
      waterCondition: initialData?.waterCondition || 'cristalina',
      ph: initialData?.ph || 7.4,
      cloro: initialData?.cloro || 0,
      alcalinidade: initialData?.alcalinidade || 100,
      chlorineType: initialData?.chlorineType || '3-em-1',
      daysUntilNext: initialData?.daysUntilNext || 7,
      productsUsed: initialData?.productsUsed || '',
      checklist: initialData?.checklist || '',
      productsToRequest: initialData?.productsToRequest || '',
      description: initialData?.description || '',
      departureTime: initialData?.departureTime || getCurrentTime(),
    },
  });

  // Carregar processos selecionados do checklist inicial
  useEffect(() => {
    if (initialData?.checklist) {
      const processes = initialData.checklist
        .split('\n')
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(line => line.length > 0 && processOptions.includes(line));
      setSelectedProcesses(processes);
    }
  }, [initialData?.checklist]);

  // Carregar produtos solicitados iniciais
  useEffect(() => {
    if (initialData?.productsToRequest) {
      const productsMap: Record<string, number> = {};
      const lines = initialData.productsToRequest.split('\n');
      lines.forEach(line => {
        const match = line.match(/^[•\-]\s*(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, productName, quantity] = match;
          if (productOptions.includes(productName)) {
            productsMap[productName] = parseInt(quantity, 10);
          }
        }
      });
      setSelectedProductsToRequest(productsMap);
    }
  }, [initialData?.productsToRequest]);

  // Função para calcular produtos
  const calcularProdutos = (
    waterCondition: string,
    ph: number,
    cloro: number,
    alcalinidade: number,
    chlorineType: string,
    daysUntilNext: number
  ): ProductSuggestion[] => {
    const volume = client?.poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    if (waterCondition === 'cristalina' || waterCondition === 'turva' || waterCondition === 'leitosa') {
      if (ph > 7.6) {
        const diferencaPh = ph - 7.4;
        const redutorNecessario = (15 * volume * diferencaPh) / 0.2;
        suggestions.push({ id: 'redutor-ph', name: 'Redutor de pH', quantity: Math.round(redutorNecessario), unit: 'ml' });
      }
      if (cloro === 0) {
        if (chlorineType === '3-em-1') {
          suggestions.push({ id: 'cloro-3em1-inicial', name: 'Cloro 3 em 1', quantity: Math.round(30 * volume), unit: 'g' });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          suggestions.push({ id: 'cloro-estabilizado-inicial', name: chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio', quantity: Math.round(15 * volume), unit: 'g' });
        }
      } else if (cloro >= 1 && cloro <= 2) {
        if (chlorineType === '3-em-1') {
          suggestions.push({ id: 'cloro-3em1-manutencao', name: 'Cloro 3 em 1 (Manutenção)', quantity: Math.round(volume * 2 * daysUntilNext), unit: 'g' });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          suggestions.push({ id: 'cloro-estabilizado-manutencao', name: `${chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio'} (Manutenção)`, quantity: Math.round(volume * 1 * daysUntilNext), unit: 'g' });
        }
      }
      if (alcalinidade <= 70) {
        const aumentoDesejado = 100 - alcalinidade;
        const elevadorNecessario = (aumentoDesejado / 10) * 17 * volume;
        suggestions.push({ id: 'elevador-alcalinidade', name: 'Elevador de Alcalinidade', quantity: Math.round(elevadorNecessario), unit: 'g' });
      }
      const doseClarificante = (waterCondition === 'turva' || waterCondition === 'leitosa') ? 6 : 1.5;
      suggestions.push({ id: 'clarificante', name: waterCondition === 'cristalina' ? 'Clarificante' : 'Clarificante (Dosagem Reforçada)', quantity: Math.round(doseClarificante * volume), unit: 'ml' });
      suggestions.push({ id: 'algicida', name: 'Algicida', quantity: Math.round(6 * volume), unit: 'ml' });
      const pastilhas = volume / 25;
      if (pastilhas >= 0.5) {
        suggestions.push({ id: 'pastilha-cloro', name: 'Pastilha de Cloro', quantity: Math.ceil(pastilhas), unit: pastilhas > 1 ? 'unidades' : 'unidade' });
      }
    }

    if (waterCondition === 'verde') {
      suggestions.push({ id: 'sulfato-aluminio', name: 'Sulfato de Alumínio (Decantação)', quantity: Math.round(20 * volume), unit: 'g' });
      suggestions.push({ id: 'barrilha', name: 'Barrilha (Elevador de pH)', quantity: Math.round(20 * volume), unit: 'g' });
      suggestions.push({ id: 'cloro-choque', name: 'Cloro Granulado (Choque)', quantity: Math.round(30 * volume), unit: 'g' });
    }

    return suggestions;
  };

  // Recalcular produtos
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.waterCondition && value.ph !== undefined && value.cloro !== undefined && value.alcalinidade !== undefined && value.chlorineType && value.daysUntilNext) {
        const produtos = calcularProdutos(
          value.waterCondition,
          value.ph,
          value.cloro,
          value.alcalinidade,
          value.chlorineType,
          value.daysUntilNext
        );
        setSuggestedProducts(produtos);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, client?.poolVolume]);

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProductIds(newSelected);
    
    const selectedProds = suggestedProducts
      .filter(p => newSelected.has(p.id))
      .map(p => `${p.name} ${p.quantity}${p.unit}`)
      .join(', ');
    form.setValue('productsUsed', selectedProds);
  };

  const toggleProcess = (process: string) => {
    setSelectedProcesses(prev => prev.includes(process) ? prev.filter(p => p !== process) : [...prev, process]);
  };

  const updateProductQuantity = (productName: string, quantity: number) => {
    setSelectedProductsToRequest(prev => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[productName];
      else updated[productName] = quantity;
      return updated;
    });
  };

  const handleSendReportWhatsApp = () => {
    if (!client?.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }
    const data = form.getValues();
    let message = `🏊 Relatório da Manutenção - ${client.name}\n`;
    message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    if (data.departureTime) message += `⏰ *Saída:* ${data.departureTime}\n`;
    message += `💧 Parâmetros da Água:\n`;
    if (data.ph) message += `• pH: ${data.ph}\n`;
    if (data.cloro) message += `• Cloro: ${data.cloro} ppm\n`;
    if (data.alcalinidade) message += `• Alcalinidade: ${data.alcalinidade} ppm\n`;
    if (data.waterCondition) message += `• Condição: ${data.waterCondition}\n`;
    if (data.checklist) message += `\n🔄 Processos:\n${data.checklist}\n`;
    if (data.productsUsed) message += `\n🧪 Produtos:\n${data.productsUsed}\n`;
    if (data.productsToRequest) message += `\n📦 Solicitação:\n${data.productsToRequest}\n`;
    if (data.description) message += `\n📝 Obs:\n${data.description}\n`;
    message += `\n✅ Visita concluída!`;
    
    const phoneNumber = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNext = () => {
    if (step === 3) {
      const checklistText = selectedProcesses.map(p => `• ${p}`).join('\n');
      form.setValue('checklist', checklistText);
    }
    if (step === 4) {
      const productsText = Object.entries(selectedProductsToRequest)
        .filter(([, quantity]) => quantity > 0)
        .map(([name, quantity]) => `• ${name} (${quantity})`)
        .join('\n');
      form.setValue('productsToRequest', productsText);
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleFinalize = async () => {
    const data = form.getValues();
    const structuredProducts = suggestedProducts.filter(p => selectedProductIds.has(p.id));
    await onSubmit(data, structuredProducts);
    setStep(6); // Success step
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* Step 1: Condição e Cloro */}
        {step === 1 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 1/5: Condições Iniciais</CardTitle>
              <CardDescription>Informe o estado atual da piscina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="waterCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condição da Água</FormLabel>
                    <FormControl>
                      <select className="flex w-full rounded-md border bg-background px-3 py-2" {...field}>
                        <option value="cristalina">✨ Cristalina</option>
                        <option value="turva">🌫️ Turva</option>
                        <option value="verde">🟢 Verde</option>
                        <option value="leitosa">🥛 Leitosa</option>
                        <option value="decantando">⏳ Decantando</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chlorineType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cloro</FormLabel>
                    <FormControl>
                      <select className="flex w-full rounded-md border bg-background px-3 py-2" {...field}>
                        <option value="3-em-1">Cloro 3 em 1</option>
                        <option value="estabilizado">Cloro Estabilizado</option>
                        <option value="hipoclorito">Hipoclorito de Cálcio</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="daysUntilNext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias até próxima visita</FormLabel>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" onClick={() => field.onChange(Math.max(1, Number(field.value) - 1))}>-</Button>
                      <span className="text-xl font-bold">{field.value}</span>
                      <Button type="button" variant="outline" onClick={() => field.onChange(Math.min(30, Number(field.value) + 1))}>+</Button>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleNext} className="w-full">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Parâmetros e Produtos */}
        {step === 2 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 2/5: Parâmetros e Tratamento</CardTitle>
              <CardDescription>Medições e produtos aplicados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {['ph', 'cloro', 'alcalinidade'].map((param) => (
                  <FormField
                    key={param}
                    control={form.control}
                    name={param as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">{param === 'ph' ? 'pH' : param}</FormLabel>
                        <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const val = Number(field.value);
                            if (param === 'ph') field.onChange((val - 0.2).toFixed(1));
                            else if (param === 'cloro') field.onChange(Math.max(0, val - 1));
                            else field.onChange(Math.max(0, val - 10));
                          }}>-</Button>
                          <span className="min-w-[60px] text-center font-mono text-lg">{Number(field.value).toFixed(param === 'ph' ? 1 : 0)}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const val = Number(field.value);
                            if (param === 'ph') field.onChange((val + 0.2).toFixed(1));
                            else if (param === 'cloro') field.onChange(val + 1);
                            else field.onChange(val + 10);
                          }}>+</Button>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {suggestedProducts.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">Sugestões de Aplicação</h4>
                  <div className="space-y-2">
                    {suggestedProducts.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox id={p.id} checked={selectedProductIds.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                        <label htmlFor={p.id} className="text-sm cursor-pointer flex-1">
                          {p.name} <span className="font-bold text-green-600">({p.quantity}{p.unit})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="productsUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produtos Utilizados (Texto)</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: Cloro 200g" /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Checklist */}
        {step === 3 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 3/5: Checklist de Serviços</CardTitle>
              <CardDescription>O que foi realizado hoje?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {processOptions.map((process) => (
                <div key={process} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => toggleProcess(process)}>
                  <Checkbox checked={selectedProcesses.includes(process)} onCheckedChange={() => toggleProcess(process)} />
                  <label className="text-sm font-medium cursor-pointer flex-1">{process}</label>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Solicitação de Produtos */}
        {step === 4 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 4/5: Solicitar Produtos</CardTitle>
              <CardDescription>O que está faltando no cliente?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {productOptions.map((product) => (
                <div key={product} className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-sm font-medium">{product}</span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateProductQuantity(product, (selectedProductsToRequest[product] || 0) - 1)} disabled={!selectedProductsToRequest[product]}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{selectedProductsToRequest[product] || 0}</span>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateProductQuantity(product, (selectedProductsToRequest[product] || 0) + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleNext} className="flex-1">Avançar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Finalização */}
        {step === 5 && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-none">
            <CardHeader>
              <CardTitle>Passo 5/5: Finalizar Visita</CardTitle>
              <CardDescription>Revise e encerre o atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Saída</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <Button type="button" variant="outline" onClick={() => form.setValue('departureTime', getCurrentTime())}>Agora</Button>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Gerais</FormLabel>
                    <FormControl><textarea className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm" {...field} placeholder="Alguma observação importante?" /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
              <Button onClick={handleFinalize} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {isLoading ? 'Salvando...' : 'Finalizar e Salvar'} <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 6: Sucesso */}
        {step === 6 && (
          <Card className="animate-in zoom-in-95 duration-300 border-none shadow-none bg-green-50 dark:bg-green-900/20">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-200" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-100">Visita Registrada!</h2>
                <p className="text-green-600 dark:text-green-300">Os dados foram salvos com sucesso.</p>
              </div>
              <Button onClick={handleSendReportWhatsApp} size="lg" className="w-full max-w-xs bg-green-600 hover:bg-green-700">
                <Send className="mr-2 h-5 w-5" /> Enviar Relatório WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Form>
  );
}