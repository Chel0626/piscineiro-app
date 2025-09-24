'use clieimport { ChevronDown, ChevronRight, FlaskConical, Play, ClipboardCheck } from "lucide-react";t';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, FlaskConical, Play, ClipboardCheck } from 'lucide-react';

// Importamos o schema e o tipo do nosso arquivo.
import { aiHelperSchema, AiHelperFormData } from '@/lib/schemas/aiHelperSchema';

// Tipo para a resposta estruturada da IA
interface AiResponse {
  diagnostico: {
    titulo: string;
    descricao: string;
    status_geral: 'CRITICO' | 'ALERTA' | 'OK';
  };
  parametros: Array<{
    parametro: string;
    valor: number | null;
    status: 'BAIXO' | 'IDEAL' | 'ALTO';
    faixa_ideal: string;
  }>;
  plano_de_acao: Array<{
    etapa: number;
    titulo: string;
    instrucoes: string;
    importancia: 'CRITICA' | 'RECOMENDADA';
  }>;
}

// Função auxiliar para converter um arquivo para base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });

// CORREÇÃO: Removemos 'clientId' pois não é mais necessário com a API Route.
interface AiHelperProps {
  poolVolume?: number;
}

export function AiHelper({ poolVolume }: AiHelperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    diagnostico: false,
    parametros: false,
    plano_acao: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para determinar a cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICO': return 'red';
      case 'ALERTA': return 'yellow';
      case 'OK': return 'green';
      case 'BAIXO': return 'red';
      case 'ALTO': return 'red';
      case 'IDEAL': return 'green';
      case 'CRITICA': return 'red';
      case 'RECOMENDADA': return 'blue';
      default: return 'gray';
    }
  };

  const form = useForm<AiHelperFormData>({
    defaultValues: {
      volume: poolVolume || undefined,
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
      foto: undefined,
      description: '',
    },
  });

  const onSubmit = async (data: AiHelperFormData) => {
    const validationResult = aiHelperSchema.safeParse(data);
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    setAiResponse(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (validationResult.data.foto?.[0]) {
        const file = validationResult.data.foto[0];
        imageBase64 = await fileToBase64(file);
        mimeType = file.type;
      }

      toast.info("Enviando dados para o Ajudante IA...");

      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          poolVolume: validationResult.data.volume,
          ph: validationResult.data.ph,
          cloro: validationResult.data.cloro,
          alcalinidade: validationResult.data.alcalinidade,
          description: validationResult.data.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o plano de ação.');
      }

      const result = await response.json();
      
      // Tentar fazer o parse da resposta JSON estruturada
      try {
        const parsedResponse: AiResponse = JSON.parse(result.plan);
        setAiResponse(parsedResponse);
        toast.success("Plano de ação gerado!");
      } catch (parseError) {
        console.error("Erro ao fazer parse da resposta JSON:", parseError);
        toast.error("Resposta da IA em formato inválido");
      }

    } catch (error) {
      const err = error as Error;
      console.error("Erro ao gerar plano de ação:", err);
      toast.error(err.message || "Ocorreu um erro ao processar a solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  const photoRef = form.register("foto");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajudante IA</CardTitle>
        <CardDescription>
          Envie uma foto e os parâmetros da água para receber um plano de ação detalhado do nosso especialista virtual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Foto da Piscina (opcional)</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" {...photoRef} />
                </FormControl>
                <FormMessage>{form.formState.errors.foto?.message?.toString()}</FormMessage>
              </FormItem>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (caso não tenha foto)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descreva as condições da piscina..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Campo de Volume */}
            <div className="grid grid-cols-1">
              <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume da Piscina (mil litros)</FormLabel>
                    <FormControl><Input type="number" step="0.5" placeholder="25" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pH</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="7.2" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cloro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cloro (ppm)</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="1.5" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alcalinidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alcalinidade (ppm)</FormLabel>
                    <FormControl><Input type="number" step="1" placeholder="100" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Analisando...' : 'Gerar Plano de Ação'}
            </Button>
          </form>
        </Form>
        
        {isLoading && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Analisando dados e gerando plano...</p>
          </div>
        )}
        
        {aiResponse && (
          <div className="mt-6 space-y-4">
            {/* Diagnóstico */}
            <Card className={`border-${getStatusColor(aiResponse.diagnostico.status_geral)}-200 dark:border-${getStatusColor(aiResponse.diagnostico.status_geral)}-800 transition-all duration-200 hover:shadow-md`}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleSection('diagnostico')}
              >
                <CardTitle className={`flex items-center justify-between text-${getStatusColor(aiResponse.diagnostico.status_geral)}-800 dark:text-${getStatusColor(aiResponse.diagnostico.status_geral)}-200`}>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5" />
                    {aiResponse.diagnostico.titulo}
                    <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(aiResponse.diagnostico.status_geral)}-100 text-${getStatusColor(aiResponse.diagnostico.status_geral)}-800`}>
                      {aiResponse.diagnostico.status_geral}
                    </span>
                  </div>
                  {expandedSections.diagnostico ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.diagnostico && (
                <CardContent>
                  <div className={`bg-${getStatusColor(aiResponse.diagnostico.status_geral)}-50 dark:bg-${getStatusColor(aiResponse.diagnostico.status_geral)}-950/30 p-4 rounded-lg`}>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {aiResponse.diagnostico.descricao}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Parâmetros */}
            <Card className="border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-md">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleSection('parametros')}
              >
                <CardTitle className="flex items-center justify-between text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Análise dos Parâmetros
                  </div>
                  {expandedSections.parametros ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.parametros && (
                <CardContent>
                  <div className="grid gap-3">
                    {aiResponse.parametros.map((param, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg bg-${getStatusColor(param.status)}-50 dark:bg-${getStatusColor(param.status)}-950/30`}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{param.parametro}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {param.valor !== null ? param.valor : 'Não medido'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(param.status)}-100 text-${getStatusColor(param.status)}-800`}>
                            {param.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Ideal: {param.faixa_ideal}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Plano de Ação */}
            <Card className="border-green-200 dark:border-green-800 transition-all duration-200 hover:shadow-md">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleSection('plano_acao')}
              >
                <CardTitle className="flex items-center justify-between text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Plano de Ação
                  </div>
                  {expandedSections.plano_acao ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.plano_acao && (
                <CardContent>
                  <div className="space-y-4">
                    {aiResponse.plano_de_acao.map((etapa, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 border-${getStatusColor(etapa.importancia)}-500 bg-${getStatusColor(etapa.importancia)}-50 dark:bg-${getStatusColor(etapa.importancia)}-950/30`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">Etapa {etapa.etapa}:</span>
                          <span className="font-medium text-sm">{etapa.titulo}</span>
                          <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(etapa.importancia)}-100 text-${getStatusColor(etapa.importancia)}-800`}>
                            {etapa.importancia}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {etapa.instrucoes}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}