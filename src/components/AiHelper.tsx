'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

// Schema para validar os inputs do nosso formulário de IA
const aiHelperSchema = z.object({
  ph: z.coerce.number().min(0, "pH inválido."),
  cloro: z.coerce.number().min(0, "Cloro inválido."),
  alcalinidade: z.coerce.number().min(0, "Alcalinidade inválida."),
  // Valida se um arquivo foi selecionado
  foto: z.instanceof(FileList).refine(files => files?.length === 1, "A foto é obrigatória."),
});

type AiHelperFormData = z.infer<typeof aiHelperSchema>;

interface AiHelperProps {
  poolVolume: number;
  clientId: string;
}

export function AiHelper({ poolVolume, clientId }: AiHelperProps) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [iaResponse, setIaResponse] = useState<string | null>(null);

  const form = useForm<AiHelperFormData>({
    resolver: zodResolver(aiHelperSchema),
    defaultValues: {
      ph: undefined,
      cloro: undefined,
      alcalinidade: undefined,
      foto: undefined,
    },
  });

  const onSubmit = async (data: AiHelperFormData) => {
    if (!user) {
      toast.error("Você precisa estar logado para usar esta função.");
      return;
    }

    setIsLoading(true);
    setIaResponse(null);

    try {
      // 1. Upload da imagem para o Firebase Storage
      const file = data.foto[0];
      const storageRef = ref(storage, `diagnostics/${clientId}/${user.uid}/${new Date().toISOString()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // 2. Chamada para a futura Cloud Function (atualmente simulada)
      toast.info("Simulando chamada para a IA... A integração real será o próximo passo.");
      console.log("Dados para enviar para a Cloud Function:", {
        imageUrl,
        poolVolume,
        ph: data.ph,
        cloro: data.cloro,
        alcalinidade: data.alcalinidade,
      });

      // Simulação de resposta da IA
      const mockResponse = `
### Plano de Ação para Piscina de ${poolVolume}m³

Com base na análise da imagem e nos parâmetros fornecidos (pH: **${data.ph}**, Cloro: **${data.cloro}**, Alcalinidade: **${data.alcalinidade}**), segue um plano de ação detalhado:

1.  **Correção de Alcalinidade (Prioridade 1):**
    * **Diagnóstico:** A alcalinidade está baixa, o que pode causar flutuações bruscas no pH.
    * **Ação:** Adicionar **${(poolVolume * 17).toFixed(0)} gramas** de elevador de alcalinidade (bicarbonato de sódio) diretamente na piscina.
    * **Instrução:** Deixar o filtro na posição "recircular" por 2 horas.

2.  **Correção de pH (Prioridade 2):**
    * **Diagnóstico:** O pH está ligeiramente ácido.
    * **Ação:** Após ajustar a alcalinidade, aguardar 6 horas e medir novamente. Se ainda estiver baixo, adicionar **${(poolVolume * 5).toFixed(0)} gramas** de elevador de pH (barrilha leve).

3.  **Sanitização (Cloro):**
    * **Diagnóstico:** Nível de cloro livre está abaixo do ideal.
    * **Ação:** Realizar uma supercloração ao final do dia. Adicionar **${(poolVolume * 14).toFixed(0)} gramas** de cloro granulado.
    * **Instrução:** Dissolver o cloro em um balde com água da própria piscina antes de aplicar.

*Este é um plano de ação simulado. A integração real com o Gemini será o próximo passo.*
      `;
      setIaResponse(mockResponse);

    } catch (error) {
      console.error("Erro ao gerar plano de ação:", error);
      toast.error("Ocorreu um erro ao processar a solicitação.");
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
                <FormMessage>{form.formState.errors.foto?.message}</FormMessage>
              </FormItem>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ph"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pH</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="7.2" {...field} /></FormControl>
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
                    <FormControl><Input type="number" step="0.1" placeholder="1.5" {...field} /></FormControl>
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
                    <FormControl><Input type="number" step="1" placeholder="100" {...field} /></FormControl>
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
            {/* Usamos 'prose' do Tailwind para formatar o Markdown automaticamente */}
            <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: iaResponse.replace(/\n/g, '<br />') }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}