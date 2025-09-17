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
import { ProductUsage, VisitProductManager } from './VisitProductManager';
import { useClientDetails } from '@/hooks/useClientDetails';
import { toast } from 'sonner';
import { Send, Camera, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const productUsageSchema = z.object({
  productName: z.string(),
  quantity: z.number().min(1),
});

const formSchema = z.object({
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  productsUsed: z.array(productUsageSchema),
  productsRequested: z.array(productUsageSchema),
  description: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  poolPhoto: z.string().optional(), // URL da foto armazenada
});

export type VisitFormData = z.infer<typeof formSchema>;

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
      ph: initialData?.ph || 0,
      cloro: initialData?.cloro || 0,
      alcalinidade: initialData?.alcalinidade || 0,
      productsUsed: initialData?.productsUsed || [],
      productsRequested: initialData?.productsRequested || [],
      description: initialData?.description || '',
      arrivalTime: initialData?.arrivalTime || getCurrentTime(),
      departureTime: initialData?.departureTime || '',
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

  // Função para remover foto
  const removePhoto = () => {
    setPhotoPreview('');
    form.setValue('poolPhoto', '');
  };

  // Função para definir horário de saída
  const setDepartureTime = () => {
    const currentTime = getCurrentTime();
    form.setValue('departureTime', currentTime);
  };

  const handleProductsUsedChange = (products: ProductUsage[]) => {
    form.setValue('productsUsed', products);
  };

  const handleProductsRequestedChange = (products: ProductUsage[]) => {
    form.setValue('productsRequested', products);
  };

  const handleFormSubmit = async (data: VisitFormData) => {
    try {
      const validatedData = formSchema.parse(data);
      
      // Filtrar campos undefined antes de enviar ao Firebase
      const cleanedData = {
        ...validatedData,
        // Remove description se for vazia
        ...(validatedData.description && validatedData.description.trim() 
          ? { description: validatedData.description.trim() } 
          : {})
      };
      
      onSubmit(cleanedData);
      form.reset({
        ph: 0,
        cloro: 0,
        alcalinidade: 0,
        productsUsed: [],
        productsRequested: [],
        description: '',
        arrivalTime: getCurrentTime(), // Novo horário de chegada
        departureTime: '',
        poolPhoto: '',
      });
      
      // Limpar estados de foto
      setPhotoPreview('');
      setIsCapturing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          form.setError(err.path[0] as keyof VisitFormData, {
            type: 'manual',
            message: err.message,
          });
        });
      }
    }
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
    
    // Horários de atendimento
    if (data.arrivalTime || data.departureTime) {
      message += `⏰ Horários:\n`;
      if (data.arrivalTime) message += `• Chegada: ${data.arrivalTime}\n`;
      if (data.departureTime) message += `• Saída: ${data.departureTime}\n`;
      message += `\n`;
    }
    
    // Parâmetros da água
    message += `💧 Parâmetros da Água:\n`;
    if (data.ph) message += `• pH: ${data.ph}\n`;
    if (data.cloro) message += `• Cloro: ${data.cloro} ppm\n`;
    if (data.alcalinidade) message += `• Alcalinidade: ${data.alcalinidade} ppm\n`;
    
    // Produtos utilizados
    if (data.productsUsed && data.productsUsed.length > 0) {
      message += `\n🧪 Produtos Utilizados:\n`;
      data.productsUsed.forEach(product => {
        message += `• ${product.productName} (${product.quantity}x)\n`;
      });
    }
    
    // Produtos solicitados
    if (data.productsRequested && data.productsRequested.length > 0) {
      message += `\n🛒 Produtos Necessários:\n`;
      data.productsRequested.forEach(product => {
        message += `• ${product.productName} (${product.quantity}x)\n`;
      });
    }
    
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
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="ph"
            render={({ field }) => (
              <FormItem>
                <FormLabel>pH</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="7.2" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="number" step="0.1" placeholder="1.5" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="number" step="1" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="arrivalTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Chegada
                </FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                    readOnly 
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                      placeholder="--:--"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={setDepartureTime}
                  >
                    Agora
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção de Foto da Piscina */}
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

        <div className="mt-6">
          <VisitProductManager
            clientId={clientId}
            onProductsUsedChange={handleProductsUsedChange}
            onProductsRequestedChange={handleProductsRequestedChange}
          />
        </div>

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