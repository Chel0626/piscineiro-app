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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { IMaskInput } from 'react-imask';
import { UseFormReturn } from 'react-hook-form';
// Importamos nosso tipo unificado
import { ClientFormData } from '@/lib/validators/clientSchema';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fetchInflationIndex } from '@/lib/utils/inflation';

interface ClientFormProps {
  // O formulário e a função de submit agora usam o mesmo tipo
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ form, onSubmit }: ClientFormProps) {
  const daysOfWeek = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];
    // Sugere a data prevista da próxima troca de areia
    React.useEffect(() => {
      const subscription = form.watch((value, { name }) => {
        if (name === 'lastSandChange') {
          const lastSandChange = value.lastSandChange;
          if (lastSandChange) {
            const lastDate = new Date(lastSandChange);
            if (!isNaN(lastDate.getTime())) {
              lastDate.setMonth(lastDate.getMonth() + 18);
              const suggested = format(lastDate, 'yyyy-MM-dd');
              form.setValue('nextSandChange', suggested);
            }
          }
        }
      });
      return () => subscription.unsubscribe();
    }, [form]);
  const [showReajuste, setShowReajuste] = useState(false);
  const [novoValor, setNovoValor] = useState(null as number | null);
  const [inflacaoSugestao, setInflacaoSugestao] = useState(null as number | null);
  const [indiceInflacao, setIndiceInflacao] = useState(null as number | null);
  const [loadingInflacao, setLoadingInflacao] = useState(false);

  // Buscar último reajuste
  const reajusteHistory = form.getValues().reajusteHistory || [];
  const ultimoReajuste = reajusteHistory.length > 0 ? reajusteHistory[reajusteHistory.length - 1] : null;
  const valorAntigo = ultimoReajuste ? ultimoReajuste.newValue : form.getValues().serviceValue;
  const dataUltimoReajuste = ultimoReajuste ? ultimoReajuste.date : null;
  const dataInicioContrato = form.watch('contractStartDate'); // Watch para atualizar se mudar

  async function buscarInflacaoOnline() {
    const dataBase = dataUltimoReajuste || dataInicioContrato;
    
    if (!dataBase) {
      alert("Para calcular a inflação, defina a Data de Início do Contrato.");
      return;
    }

    setLoadingInflacao(true);
    try {
      // Garante que a data seja interpretada corretamente (evita problemas de fuso horário)
      const [ano, mes, dia] = dataBase.split('-').map(Number);
      const startDate = new Date(ano, mes - 1, dia);
      const endDate = new Date();
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const indice = await fetchInflationIndex(startDateStr, endDateStr);
      if (indice !== null) setIndiceInflacao(Number(indice.toFixed(2)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInflacao(false);
    }
  }

  function calcularInflacaoReal(valorAntigo: number, indice: number) {
    return valorAntigo * (1 + (indice / 100));
  }

  // Sugestão de valor pelo índice de inflação
  React.useEffect(() => {
    if (valorAntigo && indiceInflacao !== null && !isNaN(indiceInflacao)) {
      setInflacaoSugestao(Number(calcularInflacaoReal(valorAntigo, indiceInflacao).toFixed(2)));
    } else {
      setInflacaoSugestao(null);
    }
  }, [valorAntigo, indiceInflacao]);

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
        
        {/* Campos do filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="filterModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Modelo do filtro <span className="text-gray-500">(Opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Jacuzzi, Nautilus..." {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="filterSandKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Carga de areia (kg) <span className="text-gray-500">(Opcional)</span></FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 50" 
                    {...field} 
                    onChange={(e) => {
                      const val = e.target.value;
                      // Se estiver vazio, passa undefined para o formulário
                      // Se tiver valor, converte para número
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    value={field.value ?? ''} // Se for undefined/null, mostra string vazia
                    className="text-sm" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastSandChange"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Data da última troca de areia <span className="text-gray-500">(Opcional)</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextSandChange"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Data prevista da próxima troca <span className="text-gray-500">(Opcional)</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="contractStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Início do Contrato</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="text-sm" />
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
                          {loadingInflacao ? 'Buscando...' : 'Buscar online (IPCA)'}
                        </Button>
                      </div>
                      {dataUltimoReajuste ? (
                        <p className="text-[10px] text-gray-500 mb-2">
                          Desde o último reajuste: {format(new Date(dataUltimoReajuste), 'dd/MM/yyyy')}
                        </p>
                      ) : dataInicioContrato ? (
                        <p className="text-[10px] text-gray-500 mb-2">
                          Desde o início do contrato: {format(new Date(dataInicioContrato + 'T12:00:00'), 'dd/MM/yyyy')}
                        </p>
                      ) : null}
                      <Input
                        type="number"
                        placeholder="Sugestão pelo índice informado"
                        className="mb-1"
                        value={inflacaoSugestao ?? ''}
                        disabled
                      />
                    </div>
                    {/* Histórico de reajustes */}
                    {reajusteHistory && reajusteHistory.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Histórico de Reajustes</h4>
                        <ul className="space-y-2 text-xs max-h-32 overflow-y-auto">
                          {reajusteHistory.map((r, idx) => (
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
                    {novoValor && valorAntigo && (
                      <div className="text-xs text-gray-700 mb-2">
                        Acréscimo: R$ {(novoValor - valorAntigo).toFixed(2)} ({(((novoValor - valorAntigo) / valorAntigo) * 100).toFixed(2)}%)
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => {
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
                          setShowReajuste(false);
                          setNovoValor(null);
                        }}
                      >Salvar reajuste</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowReajuste(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />

                  {/* Frequência e dias da semana das visitas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="visitFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Frequência das visitas</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a frequência" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">1x por semana</SelectItem>
                                <SelectItem value="biweekly">2x por semana</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="visitDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Dia(s) da semana das visitas</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {daysOfWeek.map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={day}
                                    checked={field.value?.includes(day) || false}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...(field.value || []), day]);
                                      } else {
                                        field.onChange(field.value?.filter((d: string) => d !== day) || []);
                                      }
                                    }}
                                  />
                                  <Label htmlFor={day} className="text-sm">{day}</Label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          );
        }