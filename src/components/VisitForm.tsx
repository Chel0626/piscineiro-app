'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef } from 'react';
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
import { useClientDetails } from '@/hooks/useClientDetails';
import { toast } from 'sonner';
import { Send, Camera, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  description: z.string().optional(),
  departureTime: z.string().optional(),
  poolPhoto: z.string().optional(),
});

type VisitFormData = z.infer<typeof formSchema>;

export type { VisitFormData };

interface VisitFormProps {
  onSubmit: (data: VisitFormData) => void;
  isLoading: boolean;
  clientId: string;
  initialData?: Partial<VisitFormData>;
}

export function VisitForm({ onSubmit, isLoading, clientId, initialData }: VisitFormProps) {
  const { client } = useClientDetails(clientId);
  
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
      ph: initialData?.ph || 7.4,
      cloro: initialData?.cloro || 0,
      alcalinidade: initialData?.alcalinidade || 100,
      description: initialData?.description || '',
      departureTime: initialData?.departureTime || getCurrentTime(),
      poolPhoto: initialData?.poolPhoto || '',
    },
  });

  // Estados para captura de foto
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Função para iniciar captura de foto
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Preferir câmera traseira
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera');
      setIsCapturing(false);
    }
  };

  // Função para tirar foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setPhotoPreview(photoDataUrl);
      form.setValue('poolPhoto', photoDataUrl);
      stopCamera();
    }
  };

  // Função para parar câmera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const handleSendReportWhatsApp = () => {
    if (!client?.phone) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }

    const data = form.getValues();

    // Validar se há dados para enviar
    if (!data.ph && !data.cloro && !data.alcalinidade && !data.description) {
      toast.error('Preencha pelo menos alguns dados para enviar o relatório.');
      return;
    }

    // Construir mensagem do relatório
    let message = `🏊 Relatório da Manutenção - ${client.name}\n`;
    message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;

    // Gerar mensagem para WhatsApp
    if (data.departureTime) {
      message += `⏰ *Horários:*\n`;
      if (data.departureTime) message += `• Saída: ${data.departureTime}\n`;
    }

    // Parâmetros da água
    message += `💧 Parâmetros da Água:\n`;
    if (data.ph) message += `• pH: ${data.ph}\n`;
    if (data.cloro) message += `• Cloro: ${data.cloro} ppm\n`;
    if (data.alcalinidade) message += `• Alcalinidade: ${data.alcalinidade} ppm\n`;

    // Descrição/observações
    if (data.description) {
      message += `\n📝 Observações:\n${data.description}\n`;
    }

    message += `\n✅ Serviço realizado com sucesso!`;

    // Abrir WhatsApp
    const phoneNumber = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com o relatório!');
  const removePhoto = () => {
    setPhotoPreview('');
    form.setValue('poolPhoto', '');
  };

  const handleFormSubmit = async (data: VisitFormData) => {
    // TODO: Implementar lógica de submit
    toast.success('Dados salvos com sucesso!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="ph"
            render={({ field }) => {
              const phValues = [6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0];
              const currentIndex = phValues.indexOf(Number(field.value)) >= 0 ? phValues.indexOf(Number(field.value)) : 3; // default 7.4
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
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="cloro"
            render={({ field }) => {
              const cloroValues = [0, 1, 2, 3, 4];
              const currentIndex = cloroValues.indexOf(Number(field.value)) >= 0 ? cloroValues.indexOf(Number(field.value)) : 0; // default 0
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
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="alcalinidade"
            render={({ field }) => {
              // Permitir alcalinidade de 0 até 200, de 10 em 10
              const alcalinidadeValues = Array.from({ length: 21 }, (_, i) => i * 10); // [0, 10, ..., 200]
              const currentIndex = alcalinidadeValues.indexOf(Number(field.value)) >= 0 ? alcalinidadeValues.indexOf(Number(field.value)) : 8; // default 80
              return (
                <FormItem>
                  <FormLabel>Alcalinidade (ppm)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.max(0, currentIndex - 1)])} disabled={currentIndex === 0}>-</Button>
                      <span className="min-w-[50px] text-center font-mono text-lg">{alcalinidadeValues[currentIndex]}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(alcalinidadeValues[Math.min(alcalinidadeValues.length - 1, currentIndex + 1)])} disabled={currentIndex === alcalinidadeValues.length - 1}>+</Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="mt-4 space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da Visita (opcional)</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Descreva as condições da piscina, observações importantes..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção de Horários */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Saída
                </FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                    />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => form.setValue('departureTime', getCurrentTime())}
                  >
                    Agora
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>        {/* Seção de Foto da Piscina */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Foto da Piscina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!photoPreview && !isCapturing && (
              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar Foto da Piscina
              </Button>
            )}

            {isCapturing && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border mx-auto"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                  >
                    Capturar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {photoPreview && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Foto da piscina"
                    className="w-full max-w-md rounded-lg border mx-auto"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removePhoto}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Foto capturada com sucesso!
                </p>
              </div>
            )}

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Finalizar Visita (Checkout)'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={handleSendReportWhatsApp}
            disabled={!client?.phone}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Relatório por WhatsApp
          </Button>
        </div>
      </form>
    </Form>
  );
}