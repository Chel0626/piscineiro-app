'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ProductCalculator } from '@/components/ProductCalculator';
import { ChevronDown, ChevronRight, ClipboardList, Calculator, ShoppingCart, CheckCircle, MessageCircle } from 'lucide-react';

interface CheckoutModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ clientId, isOpen, onClose }: CheckoutModalProps) {
  const { client, isLoading } = useClientDetails(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [visitData, setVisitData] = useState<VisitFormData | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVisitSubmit = async (data: VisitFormData) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      setVisitData(data);
      toast.success('Check-out realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível realizar o check-out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!client || !visitData) return;

    const message = `🏊‍♂️ *Relatório de Visita - ${client.name}*\n\n` +
      `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `📍 Endereço: ${client.address}\n` +
      `📋 Observações: ${visitData.description || 'Nenhuma observação'}\n\n` +
      `✅ Visita concluída com sucesso!`;

    const phoneNumber = client.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Número de telefone não encontrado');
    }
  };

  const handleClose = () => {
    setVisitData(null);
    setOpenSections({});
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="p-6">Carregando dados do cliente...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!client) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cliente não encontrado</DialogTitle>
          </DialogHeader>
          <div className="p-6">Não foi possível carregar os dados do cliente.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
            Check-out - {client.name}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {client.address} • {client.neighborhood}
          </p>
        </DialogHeader>

        <div className="space-y-4 p-1">
          {/* Seção 1: Registrar Nova Visita */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('visit')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Registrar Nova Visita
                </div>
                {openSections.visit ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.visit && (
              <CardContent>
                <VisitForm
                  onSubmit={handleVisitSubmit}
                  isLoading={isSubmitting}
                  clientId={clientId}
                />
              </CardContent>
            )}
          </Card>

          {/* Seção 2: Calculadora de Produtos */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('calculator')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  Calculadora de Produtos
                </div>
                {openSections.calculator ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.calculator && (
              <CardContent>
                <ProductCalculator poolVolume={client?.poolVolume} />
              </CardContent>
            )}
          </Card>

          {/* Seção 3: Produtos a Solicitar */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('products')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                  Produtos a Solicitar
                </div>
                {openSections.products ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.products && (
              <CardContent>
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Produtos a Solicitar</p>
                  <p className="text-sm">
                    Funcionalidade em desenvolvimento.<br />
                    Em breve você poderá solicitar produtos diretamente aqui.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ações de Finalização */}
          {visitData && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
                  <CheckCircle className="h-5 w-5" />
                  Check-out Concluído
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Visita registrada com sucesso! Você pode enviar o relatório para o cliente.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar Relatório via WhatsApp
                  </Button>
                  <Button 
                    onClick={handleClose}
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}