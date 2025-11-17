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
// Importamos nosso tipo unificado
import { ClientFormData } from '@/lib/validators/clientSchema';

interface ClientFormProps {
  // O formulário e a função de submit agora usam o mesmo tipo
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ form, onSubmit }: ClientFormProps) {
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
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-medium">Valor (R$)</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowReajuste(true)}>
                    Reajustar
                  </Button>
                </div>
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
                {showReajuste && (
                  <div className="mt-2 p-3 border rounded bg-gray-50">
                    {/* Modal de reajuste: campos e lógica serão implementados */}
                    <p className="text-xs mb-2 font-semibold">Reajuste de valor</p>
                    <Input type="number" placeholder="Novo valor manual" className="mb-2" />
                    <Input type="number" placeholder="Sugestão pelo índice de inflação" className="mb-2" disabled />
                    <div className="text-xs text-gray-600 mb-2">Valor anterior: R$ {field.value?.toFixed(2)}</div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="default">Salvar reajuste</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowReajuste(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />
        import { useState } from 'react';
          import { format } from 'date-fns';
          import { fetchInflationIndex } from '@/lib/utils/inflation';
          const [showReajuste, setShowReajuste] = useState(false);
          const [novoValor, setNovoValor] = useState<number | null>(null);
          const [inflacaoSugestao, setInflacaoSugestao] = useState<number | null>(null);
          const [indiceInflacao, setIndiceInflacao] = useState<number | null>(null);
          const [loadingInflacao, setLoadingInflacao] = useState(false);
  async function buscarInflacaoOnline() {
    if (!dataUltimoReajuste) return;
    setLoadingInflacao(true);
    const startDate = format(new Date(dataUltimoReajuste), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const indice = await fetchInflationIndex(startDate, endDate);
    if (indice !== null) setIndiceInflacao(Number(indice.toFixed(2)));
    setLoadingInflacao(false);
  }

          // Simulação de cálculo de inflação (pode ser substituído por API real)
          function calcularInflacaoReal(valorAntigo: number, indice: number) {
            // indice em % acumulado (ex: 12.5 para 12,5%)
            return valorAntigo * (1 + (indice / 100));
          }

          // Buscar último reajuste
          const reajusteHistory = form.getValues().reajusteHistory || [];
          const ultimoReajuste = reajusteHistory.length > 0 ? reajusteHistory[reajusteHistory.length - 1] : null;
          const valorAntigo = ultimoReajuste ? ultimoReajuste.newValue : form.getValues().serviceValue;
          const dataUltimoReajuste = ultimoReajuste ? ultimoReajuste.date : null;

          // Sugestão de valor pelo índice de inflação
          React.useEffect(() => {
            if (valorAntigo && indiceInflacao !== null && !isNaN(indiceInflacao)) {
              setInflacaoSugestao(Number(calcularInflacaoReal(valorAntigo, indiceInflacao).toFixed(2)));
            } else {
              setInflacaoSugestao(null);
            }
          }, [valorAntigo, indiceInflacao]);
                          <div className="mt-2 p-3 border rounded bg-gray-50">
                            <p className="text-xs mb-2 font-semibold">Reajuste de valor</p>
                            <Input
                              type="number"
                              placeholder="Novo valor manual"
                              className="mb-2"
                              value={novoValor ?? ''}
                              onChange={e => setNovoValor(Number(e.target.value))}
                            />
                            <div className="mb-2 flex flex-col gap-1">
                              <label className="text-xs font-medium">Índice de inflação acumulado (%)</label>
                              <div className="flex gap-2 mb-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 12.5"
                                  value={indiceInflacao ?? ''}
                                  onChange={e => setIndiceInflacao(Number(e.target.value))}
                                  className="w-32"
                                />
                                <Button type="button" size="sm" variant="outline" onClick={buscarInflacaoOnline} disabled={loadingInflacao}>
                                  {loadingInflacao ? 'Buscando...' : 'Buscar online'}
                                </Button>
                              </div>
                              <Input
                                type="number"
                                placeholder="Sugestão pelo índice informado"
                                className="mb-1"
                                value={inflacaoSugestao ?? ''}
                                disabled
                              />
                            </div>
                                    {/* Histórico de reajustes */}
                                    {form.getValues().reajusteHistory && form.getValues().reajusteHistory.length > 0 && (
                                      <div className="mt-6">
                                        <h4 className="text-sm font-semibold mb-2">Histórico de Reajustes</h4>
                                        <ul className="space-y-2 text-xs">
                                          {form.getValues().reajusteHistory.map((r, idx) => (
                                            <li key={idx} className="border rounded p-2 bg-gray-50">
                                              <div>Data: {format(new Date(r.date), 'dd/MM/yyyy')}</div>
                                              <div>Valor antigo: R$ {r.oldValue.toFixed(2)}</div>
                                              <div>Valor novo: R$ {r.newValue.toFixed(2)}</div>
                                              <div>Acréscimo: R$ {r.diffValue.toFixed(2)} ({r.diffPercent.toFixed(2)}%)</div>
                                              {r.inflationIndex !== undefined && r.inflationIndex !== null && (
                                                <div>Índice usado: {r.inflationIndex}%</div>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                            <div className="text-xs text-gray-600 mb-2">
                              Valor anterior: R$ {valorAntigo?.toFixed(2)}<br />
                              {dataUltimoReajuste && (
                                <>Último reajuste: {format(new Date(dataUltimoReajuste), 'dd/MM/yyyy')}</>
                              )}
                            </div>
                            {novoValor && (
                              <div className="text-xs text-gray-700 mb-2">
                                Acréscimo: R$ {(novoValor - valorAntigo).toFixed(2)} ({(((novoValor - valorAntigo) / valorAntigo) * 100).toFixed(2)}%)
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={async () => {
                                  if (!novoValor || novoValor <= 0) return;
                                  const novoReajuste = {
                                    date: new Date().toISOString(),
                                    oldValue: valorAntigo,
                                    newValue: novoValor,
                                    diffValue: novoValor - valorAntigo,
                                    diffPercent: ((novoValor - valorAntigo) / valorAntigo) * 100,
                                    inflationIndex: indiceInflacao ?? null,
                                  };
                                  form.setValue('serviceValue', novoValor);
                                  form.setValue('reajusteHistory', [...reajusteHistory, novoReajuste]);
                                  // Persistir no Firestore imediatamente
                                  if (form.getValues().id) {
                                    const { doc, updateDoc } = await import('firebase/firestore');
                                    const { db } = await import('@/lib/firebase');
                                    const clientDoc = doc(db, 'clients', form.getValues().id);
                                    await updateDoc(clientDoc, {
                                      serviceValue: novoValor,
                                      reajusteHistory: [...reajusteHistory, novoReajuste],
                                    });
                                  }
                                  setShowReajuste(false);
                                  setNovoValor(null);
                                }}
                              >Salvar reajuste</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setShowReajuste(false)}>Cancelar</Button>
                            </div>
                          </div>
                        )}
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
                    {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map((day) => (
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
      </form>
    </Form>
  );
}