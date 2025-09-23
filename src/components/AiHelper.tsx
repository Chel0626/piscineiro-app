'use clieimport { ChevronDown, ChevronRight, FlaskConical, Play, ClipboardCheck } from "lucide-react";t';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown, ChevronRight, FlaskConical, Play, Target, ClipboardCheck } from 'lucide-react';

// Importamos o schema e o tipo do nosso arquivo.
import { aiHelperSchema, AiHelperFormData } from '@/lib/schemas/aiHelperSchema';

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
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    diagnostico: false,
    etapa1: false,
    etapa2: false,
    etapa3: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para extrair seções do markdown
  const extractSections = (response: string) => {
    const sections = {
      diagnostico: '',
      etapa1: '',
      etapa2: '',
      etapa3: '',
    };

    // Dividir por seções baseado nos cabeçalhos
    const lines = response.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.includes('Etapa 1') || line.includes('Diagnóstico')) {
        if (currentSection) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'etapa1';
        currentContent = [];
      } else if (line.includes('Etapa 2') || line.includes('Método de Recuperação')) {
        if (currentSection) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'etapa2';
        currentContent = [];
      } else if (line.includes('Etapa 3') || line.includes('Finalização')) {
        if (currentSection) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'etapa3';
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Adicionar a última seção
    if (currentSection && currentContent.length > 0) {
      sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
    }

    return sections;
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
      setAiResponse(result.plan);
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
            {(() => {
              const sections = extractSections(aiResponse);
              const sectionConfigs = [
                {
                  key: 'etapa1',
                  title: 'Diagnóstico',
                  icon: FlaskConical,
                  content: sections.etapa1,
                  color: 'blue'
                },
                {
                  key: 'etapa2',
                  title: 'Método de Recuperação',
                  icon: Play,
                  content: sections.etapa2,
                  color: 'purple'
                },
                {
                  key: 'etapa3',
                  title: 'Finalização',
                  icon: ClipboardCheck,
                  content: sections.etapa3,
                  color: 'green'
                }
              ];

              return sectionConfigs.map((section) => {
                if (!section.content) return null;
                
                const isExpanded = expandedSections[section.key];
                const IconComponent = section.icon;
                
                return (
                  <Card 
                    key={section.key}
                    className={`border-${section.color}-200 dark:border-${section.color}-800 transition-all duration-200 hover:shadow-md`}
                  >
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => toggleSection(section.key)}
                    >
                      <CardTitle className={`flex items-center justify-between text-${section.color}-800 dark:text-${section.color}-200`}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {section.title}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className={`bg-${section.color}-50 dark:bg-${section.color}-950/30 p-4 rounded-lg`}>
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                            {section.content}
                          </pre>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              });
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}