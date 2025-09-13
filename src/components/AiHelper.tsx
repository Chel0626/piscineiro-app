'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { marked } from 'marked';

// Importamos o schema e o tipo do nosso novo arquivo
import { aiHelperSchema, AiHelperFormData } from '@/lib/schemas/aiHelperSchema';

interface AiHelperProps {
  poolVolume: number;
  clientId: string;
}

interface IaPlanResponse {
    plan: string;
}

const functions = getFunctions();
const gerarPlanoDeAcao = httpsCallable<object, IaPlanResponse>(functions, 'gerarPlanoDeAcao');

export function AiHelper({ poolVolume, clientId }: AiHelperProps) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [iaResponse, setIaResponse] = useState<string | null>(null);

  // O restante do componente permanece o mesmo
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
      const file = data.foto[0];
      const storageRef = ref(storage, `diagnostics/${clientId}/${user.uid}/${new Date().toISOString()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      toast.info("Enviando dados para o Ajudante IA...");
      
      const result: HttpsCallableResult<IaPlanResponse> = await gerarPlanoDeAcao({
        imageUrl,
        poolVolume,
        ph: data.ph,
        cloro: data.cloro,
        alcalinidade: data.alcalinidade,
      });

      if (!result.data.plan) {
        throw new Error("A resposta da IA está vazia.");
      }

      const htmlResponse = await marked.parse(result.data.plan);
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