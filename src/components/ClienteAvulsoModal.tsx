'use client';

import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { Camera, User, Wrench, DollarSign, FileText, CheckCircle, MessageCircle } from 'lucide-react';

interface ClienteAvulsoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClienteAvulsoData {
  nome: string;
  endereco: string;
  telefone: string;
  tipoServico: string;
  valor: number;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  descricaoServico?: string;
  fotoUrl?: string;
}

const tiposServico = [
  'Limpeza Completa',
  'Tratamento Químico',
  'Manutenção Equipamentos',
  'Limpeza de Filtro',
  'Troca de Areia',
  'Reparo de Vazamentos',
  'Instalação de Equipamentos',
  'Consultoria Técnica',
  'Serviço de Emergência',
  'Outros'
];

export function ClienteAvulsoModal({ isOpen, onClose }: ClienteAvulsoModalProps) {
  const [clienteData, setClienteData] = useState<ClienteAvulsoData>({
    nome: '',
    endereco: '',
    telefone: '',
    tipoServico: '',
    valor: 0
  });
  
  const [relatorioData, setRelatorioData] = useState({
    ph: 7.0,
    cloro: 1.0,
    alcalinidade: 80,
    descricaoServico: '',
    fotoUrl: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicoConcluido, setServicoConcluido] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ClienteAvulsoData, value: string | number) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  const handleRelatorioChange = (field: string, value: string | number) => {
    setRelatorioData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Determina a extensão do arquivo baseada no tipo MIME
      const fileExtension = file.type === 'image/png' ? 'png' : 
                           file.type === 'image/gif' ? 'gif' :
                           file.type === 'image/webp' ? 'webp' : 'jpg';
      
      // Cria um nome de arquivo seguro usando apenas timestamp e extensão
      const timestamp = Date.now();
      const safeFileName = `cliente_avulso_${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, `clientes-avulsos/${safeFileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setRelatorioData(prev => ({ ...prev, fotoUrl: downloadURL }));
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      toast.error('Erro ao enviar foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalizarServico = async () => {
    if (!clienteData.nome || !clienteData.endereco || !clienteData.telefone || !clienteData.tipoServico || !clienteData.valor) {
      toast.error('Preencha todos os campos obrigatórios do cadastro');
      return;
    }

    setIsSubmitting(true);
    try {
      // Salvar no Firebase
      const clienteAvulsoRef = collection(db, 'clientes-avulsos');
      await addDoc(clienteAvulsoRef, {
        ...clienteData,
        ...relatorioData,
        timestamp: serverTimestamp(),
        mes: new Date().toISOString().slice(0, 7) // YYYY-MM para faturamento
      });

      setServicoConcluido(true);
      toast.success('Serviço avulso registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar serviço avulso:', error);
      toast.error('Erro ao registrar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!clienteData.telefone) {
      toast.error('Telefone não informado');
      return;
    }

    let message = `🏊‍♂️ *Relatório de Serviço - ${clienteData.nome}*\n\n`;
    message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    message += `📍 Endereço: ${clienteData.endereco}\n`;
    message += `🔧 Serviço: ${clienteData.tipoServico}\n`;
    message += `💰 Valor: R$ ${clienteData.valor.toFixed(2)}\n\n`;
    
    // Parâmetros da água
    message += `💧 *Parâmetros da Água:*\n`;
    message += `• pH: ${relatorioData.ph}\n`;
    message += `• Cloro: ${relatorioData.cloro} ppm\n`;
    message += `• Alcalinidade: ${relatorioData.alcalinidade} ppm\n\n`;
    
    // Descrição do serviço
    if (relatorioData.descricaoServico) {
      message += `📝 *Descrição do Serviço:*\n${relatorioData.descricaoServico}\n\n`;
    }
    
    message += `\n\n✅ Serviço realizado com sucesso!`;
    message += `\n\n🏊 _Relatório enviado automaticamente via Piscineiro Mestre APP_`;

    const phoneNumber = clienteData.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com o relatório!');
  };

  const handleClose = () => {
    setClienteData({
      nome: '',
      endereco: '',
      telefone: '',
      tipoServico: '',
      valor: 0
    });
    setRelatorioData({
      ph: 7.0,
      cloro: 1.0,
      alcalinidade: 80,
      descricaoServico: '',
      fotoUrl: ''
    });
    setServicoConcluido(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cliente Avulso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cadastro Básico */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-blue-50 [&[open]>summary>span:last-child]:rotate-180" open>
            <summary className="cursor-pointer p-4 font-medium text-blue-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cadastro do Cliente (Serviço Avulso)
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={clienteData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="João Silva"
                />
              </div>
              
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={clienteData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua das Flores, 123"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={clienteData.telefone}
                  unmask={true}
                  onAccept={(value) => handleInputChange('telefone', value)}
                  placeholder="(19) 99999-9999"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </details>

          {/* Tipo de Serviço */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-green-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-green-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Tipo de Serviço
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white">
              <Label htmlFor="tipoServico">Selecione o tipo de serviço *</Label>
              <Select onValueChange={(value) => handleInputChange('tipoServico', value)} value={clienteData.tipoServico}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {tiposServico.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </details>

          {/* Valor */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-purple-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-purple-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor do Serviço
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white">
              <Label htmlFor="valor">Valor cobrado (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={clienteData.valor}
                onChange={(e) => handleInputChange('valor', Number(e.target.value))}
                placeholder="150.00"
              />
            </div>
          </details>

          {/* Relatório */}
          <details className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden [&[open]>summary]:bg-orange-50 [&[open]>summary>span:last-child]:rotate-180">
            <summary className="cursor-pointer p-4 font-medium text-orange-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Relatório do Serviço
              </span>
              <span className="text-gray-400 transition-transform duration-200">▼</span>
            </summary>
            <div className="p-4 border-t border-gray-200 bg-white space-y-4">
              {/* Parâmetros da Água */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    value={relatorioData.ph}
                    onChange={(e) => handleRelatorioChange('ph', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="cloro">Cloro (ppm)</Label>
                  <Input
                    id="cloro"
                    type="number"
                    step="0.1"
                    value={relatorioData.cloro}
                    onChange={(e) => handleRelatorioChange('cloro', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="alcalinidade">Alcalinidade (ppm)</Label>
                  <Input
                    id="alcalinidade"
                    type="number"
                    value={relatorioData.alcalinidade}
                    onChange={(e) => handleRelatorioChange('alcalinidade', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Descrição do Serviço */}
              <div>
                <Label htmlFor="descricaoServico">Descrição do Serviço (opcional)</Label>
                <Textarea
                  id="descricaoServico"
                  value={relatorioData.descricaoServico}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleRelatorioChange('descricaoServico', e.target.value)}
                  placeholder="Descreva os procedimentos realizados..."
                  rows={3}
                />
              </div>

              {/* Foto da Piscina */}
              <div>
                <Label>Foto da Piscina (opcional)</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {isUploading ? 'Enviando...' : 'Selecionar Foto'}
                  </Button>
                  {relatorioData.fotoUrl && (
                    <span className="text-sm text-green-600">✓ Foto enviada</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {relatorioData.fotoUrl && (
                <div className="mt-4">
                  <img
                    src={relatorioData.fotoUrl}
                    alt="Foto da piscina"
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>
          </details>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            {!servicoConcluido ? (
              <Button
                onClick={handleFinalizarServico}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? 'Finalizando...' : 'Finalizar Serviço'}
              </Button>
            ) : (
              <Button
                onClick={handleEnviarWhatsApp}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar Relatório via WhatsApp
              </Button>
            )}
            
            <Button variant="outline" onClick={handleClose}>
              {servicoConcluido ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}