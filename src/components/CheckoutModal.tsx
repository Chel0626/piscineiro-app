'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientStock } from '@/hooks/useClientStock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ChevronDown, ChevronRight, ClipboardList, CheckCircle, MessageCircle } from 'lucide-react';

interface CheckoutModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback para quando finalizar com sucesso
}

export function CheckoutModal({ clientId, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { client, isLoading } = useClientDetails(clientId);
  const { stock, updateStock, deductProductByName } = useClientStock(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ visit: true });
  const [visitData, setVisitData] = useState<VisitFormData | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVisitSubmit = async (data: VisitFormData, structuredProducts?: any[]) => {
    if (!clientId) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', clientId, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      
      // Atualizar estoque com produtos utilizados
      if (structuredProducts && structuredProducts.length > 0) {
        for (const product of structuredProducts) {
          await deductProductByName(product.name, product.quantity, product.unit);
        }
      }
      
      // Marcar cliente como finalizado no dia de hoje
      const clientRef = doc(db, 'clients', clientId);
      const today = new Date().toISOString().split('T')[0];
      await updateDoc(clientRef, {
        lastVisitDate: today,
        visitStatus: 'completed'
      });
      
      setVisitData(data);
      toast.success('Check-out realizado com sucesso!');
      
      // Notificar componente pai do sucesso
      if (onSuccess) {
        onSuccess();
      }
      
      // Fechar modal após sucesso
      // setTimeout(() => {
      //   // Enviar WhatsApp automaticamente se configurado
      //   handleSendWhatsApp(data);
      //   onClose();
      // }, 1500);
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível realizar o check-out.');
    } finally {
      setIsSubmitting(false);
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
            <DialogDescription>Aguarde enquanto carregamos os dados.</DialogDescription>
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
            <DialogDescription>O cliente solicitado não foi encontrado.</DialogDescription>
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
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {client.address} • {client.neighborhood}
          </DialogDescription>
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
                  onFinish={handleClose}
                />
              </CardContent>
            )}
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
}