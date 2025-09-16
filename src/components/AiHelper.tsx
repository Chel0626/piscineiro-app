'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Droplets, FlaskConical } from 'lucide-react';

// Importamos o schema e o tipo do nosso arquivo.
import { aiHelperSchema, AiHelperFormData } from '@/lib/schemas/aiHelperSchema';

// Interface para resposta estruturada
interface StructuredResponse {
  diagnosis: string[];
  actionPlan: string[];
  urgency: 'low' | 'medium' | 'high';
}

// Função para estruturar a resposta da IA
function parseAiResponse(rawResponse: string): StructuredResponse {
  const lines = rawResponse.split('\n').filter(line => line.trim());
  
  const diagnosis: string[] = [];
  const actionPlan: string[] = [];
  let currentSection = '';
  let urgency: 'low' | 'medium' | 'high' = 'medium';

  // Detectar urgência baseada em palavras-chave
  const lowKeywords = ['manutenção', 'rotina', 'preventivo'];
  const highKeywords = ['urgente', 'crítico', 'imediato', 'perigoso', 'algicida de choque'];
  
  const responseText = rawResponse.toLowerCase();
  if (highKeywords.some(keyword => responseText.includes(keyword))) {
    urgency = 'high';
  } else if (lowKeywords.some(keyword => responseText.includes(keyword))) {
    urgency = 'low';
  }

  for (const line of lines) {
    const cleanLine = line.trim();
    
    // Identificar seções
    if (cleanLine.toLowerCase().includes('diagnóstico') || cleanLine.toLowerCase().includes('análise')) {
      currentSection = 'diagnosis';
      continue;
    }
    if (cleanLine.toLowerCase().includes('plano') || cleanLine.toLowerCase().includes('ação') || cleanLine.toLowerCase().includes('procedimento')) {
      currentSection = 'actionPlan';
      continue;
    }
    
    // Extrair itens numerados ou com marcadores
    if (cleanLine.match(/^\d+\.|^[-*•]/)) {
      const cleanItem = cleanLine.replace(/^\d+\.|^[-*•]\s*/, '').trim();
      if (cleanItem) {
        if (currentSection === 'diagnosis') {
          diagnosis.push(cleanItem);
        } else {
          actionPlan.push(cleanItem);
        }
      }
    } else if (cleanLine && !cleanLine.includes('#')) {
      // Se não encontrou seções específicas, tenta distribuir inteligentemente
      if (cleanLine.toLowerCase().includes('ph') || cleanLine.toLowerCase().includes('cloro') || cleanLine.toLowerCase().includes('alcalinidade')) {
        diagnosis.push(cleanLine);
      } else if (cleanLine.toLowerCase().includes('aplicar') || cleanLine.toLowerCase().includes('escovar') || cleanLine.toLowerCase().includes('filtrar')) {
        actionPlan.push(cleanLine);
      }
    }
  }

  // Se não conseguiu categorizar, dividir na metade
  if (diagnosis.length === 0 && actionPlan.length === 0) {
    const allItems = rawResponse.split(/\d+\.|\n/).filter(item => item.trim()).map(item => item.trim());
    const midPoint = Math.ceil(allItems.length / 2);
    diagnosis.push(...allItems.slice(0, midPoint));
    actionPlan.push(...allItems.slice(midPoint));
  }

  return { diagnosis, actionPlan, urgency };
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
  const [structuredResponse, setStructuredResponse] = useState<StructuredResponse | null>(null);

  const form = useForm<AiHelperFormData>({
    defaultValues: {
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
    setStructuredResponse(null);

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
          poolVolume,
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
      const structured = parseAiResponse(result.plan);
      setStructuredResponse(structured);
      toast.success("Plano de ação gerado!");

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
        
        {isLoading && <div className="text-center p-4">Analisando dados e gerando plano...</div>}
        
        {structuredResponse && (
          <div className="mt-6 space-y-6">
            {/* Diagnóstico */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <FlaskConical className="h-5 w-5" />
                  Diagnóstico
                  {structuredResponse.urgency && (
                    <Badge 
                      variant={
                        structuredResponse.urgency === 'high' ? 'destructive' :
                        structuredResponse.urgency === 'medium' ? 'secondary' :
                        'outline'
                      }
                    >
                      {structuredResponse.urgency === 'high' ? 'Urgente' :
                       structuredResponse.urgency === 'medium' ? 'Atenção' :
                       'Normal'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {structuredResponse.diagnosis.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Droplets className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plano de Ação */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Plano de Ação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {structuredResponse.actionPlan.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertas de Urgência */}
            {structuredResponse.urgency === 'high' && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Atenção: Situação requer intervenção imediata!</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}