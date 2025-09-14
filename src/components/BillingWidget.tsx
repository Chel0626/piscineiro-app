'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';

interface BillingData {
  totalMensal: number;
  totalAnual: number;
  clientesAtivos: number;
  proximoVencimento: string;
  recebimentosPendentes: number;
}

export function BillingWidget() {
  const [billingData, setBillingData] = useState<BillingData>({
    totalMensal: 0,
    totalAnual: 0,
    clientesAtivos: 0,
    proximoVencimento: '',
    recebimentosPendentes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados - aqui você integraria com seu backend
    const fetchBillingData = async () => {
      try {
        // TODO: Substituir por chamada real à API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setBillingData({
          totalMensal: 4850.00,
          totalAnual: 58200.00,
          clientesAtivos: 23,
          proximoVencimento: '2025-09-20',
          recebimentosPendentes: 2
        });
      } catch (error) {
        console.error('Erro ao carregar dados de faturamento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="w-full p-3 bg-gray-700 rounded-lg animate-pulse overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <div className="h-4 bg-gray-600 rounded w-20"></div>
          </div>
          <div className="h-4 w-4 bg-gray-600 rounded flex-shrink-0"></div>
        </div>
        <div className="h-5 bg-gray-600 rounded w-24 mb-1"></div>
        <div className="h-3 bg-gray-600 rounded w-16"></div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-3 h-auto bg-gray-700 hover:bg-gray-600 text-left overflow-hidden">
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <DollarSign className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Faturamento</span>
              </div>
              <Eye className="h-4 w-4 opacity-70 flex-shrink-0" />
            </div>
            <div className="text-base font-bold text-green-400 truncate">
              {formatCurrency(billingData.totalMensal)}
            </div>
            <div className="text-xs text-gray-400">Este mês</div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Resumo Financeiro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Faturamento Mensal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(billingData.totalMensal)}
              </div>
              <p className="text-sm text-muted-foreground">
                {billingData.clientesAtivos} clientes ativos
              </p>
            </CardContent>
          </Card>

          {/* Faturamento Anual */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Faturamento Anual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(billingData.totalAnual)}
              </div>
              <p className="text-sm text-muted-foreground">
                Projeção baseada no mês atual
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Informações Adicionais */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Próximo Vencimento:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(billingData.proximoVencimento)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pendências:</span>
              <span className={`text-sm font-semibold ${
                billingData.recebimentosPendentes > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {billingData.recebimentosPendentes} {billingData.recebimentosPendentes === 1 ? 'cliente' : 'clientes'}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-2">
            <Button className="w-full" variant="outline">
              Ver Relatório Completo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}