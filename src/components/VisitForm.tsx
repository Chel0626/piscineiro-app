'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useRef, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useClientDetails } from '@/hooks/useClientDetails';
import { toast } from 'sonner';
import { Send, Camera, Clock, X, Upload, CheckSquare, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProductSuggestion {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}


const formSchema = z.object({
  waterCondition: z.enum(['cristalina', 'turva', 'verde', 'leitosa', 'decantando'], { message: 'Selecione a condição da água.' }),
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  chlorineType: z.enum(['3-em-1', 'estabilizado', 'hipoclorito'], { message: 'Selecione o tipo de cloro.' }),
  daysUntilNext: z.coerce.number().min(1).max(30, { message: 'Dias até próxima manutenção deve ser entre 1 e 30.' }),
  productsUsed: z.string().optional(), // Ex: "Cloro 2L, Algicida 100ml"
  checklist: z.string().optional(), // Ex: "Escovação, Aspiração, Retrolavagem"
  productsToRequest: z.string().optional(), // Ex: "Pastilha de Cloro (5), Algicída (2)"
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
  
  // Estado para produtos sugeridos e selecionados
  const [suggestedProducts, setSuggestedProducts] = useState<ProductSuggestion[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  
  // Estado para Dialog de checklist
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  
  // Estado para Dialog de produtos a solicitar
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [selectedProductsToRequest, setSelectedProductsToRequest] = useState<Record<string, number>>({});
  
  // Opções de processos disponíveis
  const processOptions = [
    'Aspiração',
    'Peneirar',
    'Escovar Paredes e Fundo',
    'Limpar Borda',
    'Limpeza de Pré-Filtro',
    'Retrolavagem da Areia'
  ];
  
  // Opções de produtos disponíveis para solicitar
  const productOptions = [
    'Pastilha de Cloro',
    'Clarificante Líquido',
    'Clarificante Gel',
    'Algicída',
    'Elevador de Alcalinidade',
    'Redutor de pH',
    'Limpa Bordas',
    'Peróxido',
    'Tratamento Semanal',
    'Sulfato de Alumínio',
  ];
  
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
      waterCondition: initialData?.waterCondition || 'cristalina',
      ph: initialData?.ph || 7.4,
      cloro: initialData?.cloro || 0,
      alcalinidade: initialData?.alcalinidade || 100,
      chlorineType: initialData?.chlorineType || '3-em-1',
      daysUntilNext: initialData?.daysUntilNext || 7,
      productsUsed: initialData?.productsUsed || '',
      checklist: initialData?.checklist || '',
      productsToRequest: initialData?.productsToRequest || '',
      description: initialData?.description || '',
      departureTime: initialData?.departureTime || getCurrentTime(),
      poolPhoto: initialData?.poolPhoto || '',
    },
  });

  // Carregar processos selecionados do checklist inicial
  useEffect(() => {
    if (initialData?.checklist) {
      // Parsear o checklist inicial para extrair os processos
      const processes = initialData.checklist
        .split('\n')
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(line => line.length > 0 && processOptions.includes(line));
      setSelectedProcesses(processes);
    }
  }, [initialData?.checklist]);

  // Carregar produtos solicitados iniciais
  useEffect(() => {
    if (initialData?.productsToRequest) {
      // Parsear formato: "• Pastilha de Cloro (5)\n• Algicída (2)"
      const productsMap: Record<string, number> = {};
      const lines = initialData.productsToRequest.split('\n');
      lines.forEach(line => {
        const match = line.match(/^[•\-]\s*(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, productName, quantity] = match;
          if (productOptions.includes(productName)) {
            productsMap[productName] = parseInt(quantity, 10);
          }
        }
      });
      setSelectedProductsToRequest(productsMap);
    }
  }, [initialData?.productsToRequest]);

  // Função para calcular produtos baseado na condição da água e parâmetros
  const calcularProdutos = (
    waterCondition: string,
    ph: number,
    cloro: number,
    alcalinidade: number,
    chlorineType: string,
    daysUntilNext: number
  ): ProductSuggestion[] => {
    const volume = client?.poolVolume || 0;
    if (volume === 0) return [];
    
    const suggestions: ProductSuggestion[] = [];

    // ============================================
    // ÁGUA CRISTALINA, TURVA OU LEITOSA
    // ============================================
    if (waterCondition === 'cristalina' || waterCondition === 'turva' || waterCondition === 'leitosa') {
      // 1. pH - Redutor de pH se maior que 7.6
      if (ph > 7.6) {
        // Dosagem: 15ml por m³ reduz 0.2 de pH (Tabela Cris Água)
        const diferencaPh = ph - 7.4; // Queremos chegar em 7.4
        const redutorNecessario = (15 * volume * diferencaPh) / 0.2;
        suggestions.push({
          id: 'redutor-ph',
          name: 'Redutor de pH',
          quantity: Math.round(redutorNecessario),
          unit: 'ml'
        });
      }
      // Se pH < 7.2: não sugerir nada (alcalinidade baixa será corrigida)

      // 2. CLORO
      if (cloro === 0) {
        // Aplicar dosagem inicial
        if (chlorineType === '3-em-1') {
          const cloroNecessario = 30 * volume; // 30g por m³
          suggestions.push({
            id: 'cloro-3em1-inicial',
            name: 'Cloro 3 em 1',
            quantity: Math.round(cloroNecessario),
            unit: 'g'
          });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          const cloroNecessario = 15 * volume; // 15g por m³
          suggestions.push({
            id: 'cloro-estabilizado-inicial',
            name: chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio',
            quantity: Math.round(cloroNecessario),
            unit: 'g'
          });
        }
      } else if (cloro >= 1 && cloro <= 2) {
        // Cloro entre 1 e 2 ppm: manutenção (usa mesma fórmula para ambos)
        // Como cloro está baixo mas presente, aplicar dose de manutenção padrão
        
        if (chlorineType === '3-em-1') {
          // volume x 2g x dias até próxima (dosagem reduzida)
          const cloroNecessario = volume * 2 * daysUntilNext;
          suggestions.push({
            id: 'cloro-3em1-manutencao',
            name: 'Cloro 3 em 1 (Manutenção)',
            quantity: Math.round(cloroNecessario),
            unit: 'g'
          });
        } else if (chlorineType === 'estabilizado' || chlorineType === 'hipoclorito') {
          // volume x 1g x dias até próxima (dosagem reduzida)
          const cloroNecessario = volume * 1 * daysUntilNext;
          suggestions.push({
            id: 'cloro-estabilizado-manutencao',
            name: `${chlorineType === 'estabilizado' ? 'Cloro Estabilizado' : 'Hipoclorito de Cálcio'} (Manutenção)`,
            quantity: Math.round(cloroNecessario),
            unit: 'g'
          });
        }
      }

      // 3. ALCALINIDADE
      if (alcalinidade >= 80 && alcalinidade <= 120) {
        // Não sugerir nada - está ideal
      } else if (alcalinidade <= 70) {
        // Elevar alcalinidade
        // Fórmula: (aumento desejado em ppm / 10) x 17 x volume
        const aumentoDesejado = 100 - alcalinidade; // Queremos chegar em 100 ppm
        const elevadorNecessario = (aumentoDesejado / 10) * 17 * volume;
        suggestions.push({
          id: 'elevador-alcalinidade',
          name: 'Elevador de Alcalinidade',
          quantity: Math.round(elevadorNecessario),
          unit: 'g'
        });
      }
      // Se acima de 120 ppm: não sugerir elevador

      // 4. CLARIFICANTE
      // Água turva/leitosa usa 6ml/m³, cristalina usa 1.5ml/m³
      const doseClarificante = (waterCondition === 'turva' || waterCondition === 'leitosa') ? 6 : 1.5;
      const clarificante = doseClarificante * volume;
      suggestions.push({
        id: 'clarificante',
        name: waterCondition === 'cristalina' ? 'Clarificante' : 'Clarificante (Dosagem Reforçada)',
        quantity: Math.round(clarificante),
        unit: 'ml'
      });

      // 5. ALGICIDA - 6ml por m³
      const algicida = 6 * volume;
      suggestions.push({
        id: 'algicida',
        name: 'Algicida',
        quantity: Math.round(algicida),
        unit: 'ml'
      });

      // 6. PASTILHA DE CLORO - 1 pastilha para cada 25m³
      const pastilhas = volume / 25;
      if (pastilhas >= 0.5) { // Só sugere se der pelo menos meia pastilha
        suggestions.push({
          id: 'pastilha-cloro',
          name: 'Pastilha de Cloro',
          quantity: Math.ceil(pastilhas), // Arredonda para cima
          unit: pastilhas > 1 ? 'unidades' : 'unidade'
        });
      }
    }

    // ============================================
    // ÁGUA VERDE (Tratamento de Choque/Decantação)
    // ============================================
    if (waterCondition === 'verde') {
      // 1. SULFATO DE ALUMÍNIO - Dosagem: 20g por m³ (Cris Água)
      const sulfatoAluminio = 20 * volume;
      suggestions.push({
        id: 'sulfato-aluminio',
        name: 'Sulfato de Alumínio (Decantação)',
        quantity: Math.round(sulfatoAluminio),
        unit: 'g'
      });

      // 2. BARRILHA - Dosagem: 20g por m³ (Cris Água)
      const barrilha = 20 * volume;
      suggestions.push({
        id: 'barrilha',
        name: 'Barrilha (Elevador de pH)',
        quantity: Math.round(barrilha),
        unit: 'g'
      });

      // 3. CLORO CHOQUE - Dosagem: 30g por m³
      const cloroChoque = 30 * volume;
      suggestions.push({
        id: 'cloro-choque',
        name: 'Cloro Granulado (Choque)',
        quantity: Math.round(cloroChoque),
        unit: 'g'
      });

      // NÃO aplicar algicida em tratamento de decantação
    }

    return suggestions;
  };

  // Recalcular produtos quando parâmetros mudarem
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (
        value.waterCondition !== undefined &&
        value.ph !== undefined &&
        value.cloro !== undefined &&
        value.alcalinidade !== undefined &&
        value.chlorineType !== undefined &&
        value.daysUntilNext !== undefined
      ) {
        const produtos = calcularProdutos(
          value.waterCondition,
          value.ph,
          value.cloro,
          value.alcalinidade,
          value.chlorineType,
          value.daysUntilNext
        );
        setSuggestedProducts(produtos);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, client?.poolVolume]);

  // Função para alternar seleção de produto
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
    
    // Atualizar campo de produtos utilizados
    const selectedProds = suggestedProducts
      .filter(p => newSelected.has(p.id))
      .map(p => `${p.name} ${p.quantity}${p.unit}`)
      .join(', ');
    
    form.setValue('productsUsed', selectedProds);
  };

  // Estados para captura de foto
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);
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

  // Função para tirar foto (salva apenas localmente em base64)
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Salvar foto localmente (base64)
      setPhotoPreview(photoDataUrl);
      form.setValue('poolPhoto', photoDataUrl);
      
      toast.success('Foto capturada! Será incluída no relatório.');
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

  // Funções para gerenciar checklist
  const toggleProcess = (process: string) => {
    setSelectedProcesses(prev => {
      if (prev.includes(process)) {
        return prev.filter(p => p !== process);
      } else {
        return [...prev, process];
      }
    });
  };

  const saveChecklist = () => {
    // Formatar processos selecionados como lista com bullet points
    const checklistText = selectedProcesses.map(p => `• ${p}`).join('\n');
    form.setValue('checklist', checklistText);
    setShowChecklistDialog(false);
    if (selectedProcesses.length > 0) {
      toast.success(`${selectedProcesses.length} processo(s) selecionado(s)`);
    }
  };

  const openChecklistDialog = () => {
    // Ao abrir o dialog, carregar os processos já salvos
    const currentChecklist = form.getValues('checklist') || '';
    if (currentChecklist) {
      const processes = currentChecklist
        .split('\n')
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(line => line.length > 0 && processOptions.includes(line));
      setSelectedProcesses(processes);
    }
    setShowChecklistDialog(true);
  };

  // Funções para gerenciar produtos a solicitar
  const updateProductQuantity = (productName: string, quantity: number) => {
    setSelectedProductsToRequest(prev => {
      const updated = { ...prev };
      if (quantity <= 0) {
        delete updated[productName];
      } else {
        updated[productName] = quantity;
      }
      return updated;
    });
  };

  const incrementProduct = (productName: string) => {
    const current = selectedProductsToRequest[productName] || 0;
    updateProductQuantity(productName, current + 1);
  };

  const decrementProduct = (productName: string) => {
    const current = selectedProductsToRequest[productName] || 0;
    updateProductQuantity(productName, Math.max(0, current - 1));
  };

  const saveProductsToRequest = () => {
    // Formatar produtos com quantidades: "• Pastilha de Cloro (5)\n• Algicída (2)"
    const productsText = Object.entries(selectedProductsToRequest)
      .filter(([, quantity]) => quantity > 0)
      .map(([name, quantity]) => `• ${name} (${quantity})`)
      .join('\n');
    
    form.setValue('productsToRequest', productsText);
    setShowProductsDialog(false);
    
    const totalProducts = Object.keys(selectedProductsToRequest).length;
    if (totalProducts > 0) {
      toast.success(`${totalProducts} produto(s) adicionado(s) à solicitação`);
    }
  };

  const openProductsDialog = () => {
    // Ao abrir o dialog, carregar os produtos já salvos
    const currentProducts = form.getValues('productsToRequest') || '';
    if (currentProducts) {
      const productsMap: Record<string, number> = {};
      const lines = currentProducts.split('\n');
      lines.forEach(line => {
        const match = line.match(/^[•\-]\s*(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, productName, quantity] = match;
          if (productOptions.includes(productName)) {
            productsMap[productName] = parseInt(quantity, 10);
          }
        }
      });
      setSelectedProductsToRequest(productsMap);
    }
    setShowProductsDialog(true);
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

    // Horários
    if (data.departureTime) {
      message += `⏰ *Horários:*\n`;
      if (data.departureTime) message += `• Saída: ${data.departureTime}\n`;
    }

    // Parâmetros da água
    message += `💧 Parâmetros da Água:\n`;
    if (data.ph) message += `• pH: ${data.ph} (Ideal: 7.2 - 7.6)\n`;
    if (data.cloro) message += `• Cloro: ${data.cloro} ppm (Ideal: 1 - 3 ppm)\n`;
    if (data.alcalinidade) message += `• Alcalinidade: ${data.alcalinidade} ppm (Ideal: 80 - 120 ppm)\n`;
    if (data.waterCondition) message += `• Condição: ${data.waterCondition.charAt(0).toUpperCase() + data.waterCondition.slice(1)}\n`;

    // Checklist/processos
    if (data.checklist) {
      message += `\n🔄 Processos realizados:\n${data.checklist}\n`;
    }

    // Produtos utilizados
    if (data.productsUsed) {
      message += `\n🧪 Produtos utilizados:\n${data.productsUsed}\n`;
    }

    // Produtos a solicitar
    if (data.productsToRequest) {
      message += `\n📦 Solicitação de Produtos:\n${data.productsToRequest}\n`;
    }

    // Descrição/observações
    if (data.description) {
      message += `\n📝 Observações:\n${data.description}\n`;
    }

    message += `\n\n✅ Serviço realizado com sucesso!`;
    message += `\n\n🏊 _Relatório enviado automaticamente via PiscineiroAPP_`;

    // Se tem foto, fazer download automático
    if (data.poolPhoto && data.poolPhoto.startsWith('data:image')) {
      try {
        // Criar link de download da foto
        const link = document.createElement('a');
        link.href = data.poolPhoto;
        link.download = `piscina-${client.name.replace(/\s/g, '-')}-${new Date().getTime()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Foto baixada! Envie-a pelo WhatsApp após o texto.', {
          duration: 6000
        });
      } catch (error) {
        console.error('Erro ao baixar foto:', error);
      }
    }

    // Abrir WhatsApp
    const phoneNumber = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    if (!data.poolPhoto) {
      toast.success('WhatsApp aberto com o relatório!');
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    form.setValue('poolPhoto', '');
  };

  const handleFormSubmit = async (data: VisitFormData) => {
    await onSubmit(data);
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Seção 1: Condição da Água e Tipo de Cloro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <FormField
            control={form.control}
            name="waterCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">💧 Condição da Água</FormLabel>
                <FormControl>
                  <select
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  >
                    <option value="cristalina">✨ Cristalina</option>
                    <option value="turva">🌫️ Turva</option>
                    <option value="verde">🟢 Verde</option>
                    <option value="leitosa">🥛 Leitosa</option>
                    <option value="decantando">⏳ Decantando</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chlorineType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">🧪 Tipo de Cloro</FormLabel>
                <FormControl>
                  <select
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  >
                    <option value="3-em-1">Cloro 3 em 1</option>
                    <option value="estabilizado">Cloro Estabilizado</option>
                    <option value="hipoclorito">Hipoclorito de Cálcio</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção 2: Dias até próxima manutenção */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-700">
          <FormField
            control={form.control}
            name="daysUntilNext"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">📅 Dias até a Próxima Manutenção</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => field.onChange(Math.max(1, Number(field.value) - 1))}
                      disabled={Number(field.value) <= 1}
                    >
                      -
                    </Button>
                    <span className="min-w-[50px] text-center font-mono text-xl font-bold">{field.value} dias</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => field.onChange(Math.min(30, Number(field.value) + 1))}
                      disabled={Number(field.value) >= 30}
                    >
                      +
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção 3: Parâmetros Químicos */}
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
              const currentIndex = alcalinidadeValues.indexOf(Number(field.value)) >= 0 ? alcalinidadeValues.indexOf(Number(field.value)) : 10; // default 100
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

        {/* Sugestões de Produtos Calculadas */}
        {suggestedProducts.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg">
            <h3 className="font-bold text-lg text-green-900 dark:text-green-100 flex items-center gap-2 mb-3">
              🧪 Produtos Sugeridos (Volume: {client?.poolVolume}m³)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Selecione os produtos que você irá aplicar:
            </p>
            <div className="space-y-2">
              {suggestedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 transition-colors"
                >
                  <Checkbox
                    id={product.id}
                    checked={selectedProductIds.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={product.id}
                    className="flex-1 cursor-pointer select-none"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Quantidade: <span className="font-semibold text-green-600 dark:text-green-400">{product.quantity}{product.unit}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              ℹ️ Os produtos selecionados serão adicionados automaticamente ao campo &quot;Produtos Utilizados&quot;
            </p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Produtos Utilizados */}
          <FormField
            control={form.control}
            name="productsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtos Utilizados (opcional)</FormLabel>
                <FormControl>
                  <input
                    type="text"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Ex: Cloro 2L, Algicida 100ml"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Checklist/Processos */}
          <FormField
            control={form.control}
            name="checklist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Checklist/Processos (opcional)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={openChecklistDialog}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      {field.value ? 'Editar processos selecionados' : 'Selecionar processos realizados'}
                    </Button>
                    {field.value && (
                      <div className="text-sm text-muted-foreground whitespace-pre-line border rounded-md p-3 bg-muted/30">
                        {field.value}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Produtos a Solicitar */}
          <FormField
            control={form.control}
            name="productsToRequest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtos a Solicitar (opcional)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={openProductsDialog}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {field.value ? 'Editar produtos solicitados' : 'Selecionar produtos para solicitar'}
                    </Button>
                    {field.value && (
                      <div className="text-sm text-muted-foreground whitespace-pre-line border rounded-md p-3 bg-muted/30">
                        {field.value}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                <div className="relative cursor-pointer" onClick={() => setFullScreenPhoto(photoPreview)}>
                  <img
                    src={photoPreview}
                    alt="Foto da piscina"
                    className="w-full max-w-md rounded-lg border mx-auto hover:opacity-90 transition-opacity"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto();
                    }}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Clique para ampliar
                  </div>
                </div>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Foto capturada! Será incluída no relatório do WhatsApp.
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

    {/* Modal de foto em tela cheia */}
    <Dialog open={!!fullScreenPhoto} onOpenChange={() => setFullScreenPhoto(null)}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-black/95">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={fullScreenPhoto || ''}
            alt="Foto da piscina em tela cheia"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setFullScreenPhoto(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-8 w-8" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog de Checklist com Checkboxes */}
    <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione os Processos Realizados</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {processOptions.map((process) => (
            <div key={process} className="flex items-center space-x-3">
              <Checkbox
                id={process}
                checked={selectedProcesses.includes(process)}
                onCheckedChange={() => toggleProcess(process)}
              />
              <label
                htmlFor={process}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {process}
              </label>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setShowChecklistDialog(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={saveChecklist}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog de Produtos a Solicitar com Seletor de Quantidade */}
    <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecione Produtos para Solicitar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {productOptions.map((product) => {
            const quantity = selectedProductsToRequest[product] || 0;
            return (
              <div key={product} className="flex items-center justify-between gap-3 p-2 border rounded-md">
                <span className="text-sm font-medium flex-1">{product}</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => decrementProduct(product)}
                    disabled={quantity === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[30px] text-center font-mono text-sm">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => incrementProduct(product)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setShowProductsDialog(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={saveProductsToRequest}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}