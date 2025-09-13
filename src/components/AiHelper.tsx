'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { z } from 'zod';
import { marked } from 'marked';
import { aiHelperSchema, AiHelperFormData } from '@/lib/schemas/aiHelperSchema';

// Função auxiliar para converter um arquivo para base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove o prefixo "data:image/jpeg;base64," para enviar apenas os dados puros
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });

interface AiHelperProps {
  poolVolume: number;
}

export function AiHelper({ poolVolume }: AiHelperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [iaResponse, setIaResponse] = useState<string | null>(null);

  const form = useForm<AiHelperFormData>({
    // Não precisamos mais do resolver, pois a validação é manual
    defaultValues: {
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
      foto: undefined,
    },
  });

  const onSubmit = async (data: AiHelperFormData) => {
    // Validação manual para garantir que os dados estão corretos
    const validationResult = aiHelperSchema.safeParse(data);
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    setIsLoading(true);
    setIaResponse(null);

    try {
      const file = validationResult.data.foto[0];
      const imageBase64 = await fileToBase64(file);

      toast.info("Enviando dados para o Ajudante IA...");

      // Chamada para a nossa API interna do Next.js
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          mimeType: file.type,
          poolVolume,
          ph: validationResult.data.ph,
          cloro: validationResult.data.cloro,
          alcalinidade: validationResult.data.alcalinidade,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o plano de ação.');
      }

      const result = await response.json();
      const htmlResponse = await marked.parse(result.plan);
      setIaResponse(htmlResponse);
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
                <FormLabel>Foto da Piscina</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" {...photoRef} />
                </FormControl>
                <FormMessage>{form.formState.errors.foto?.message?.toString()}</FormMessage>
              </FormItem>
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
        
        {iaResponse && (
          <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold text-lg mb-2">Plano de Ação da IA:</h4>
            <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: iaResponse }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}