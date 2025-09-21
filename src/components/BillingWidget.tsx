'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { useBilling } from '@/hooks/useBilling';

export function BillingWidget() {
  const [showValues, setShowValues] = useState(false);
  const billingData = useBilling();

  const formatCurrency = (value: number) => {
    if (!showValues) return '•••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleShowValues = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowValues(!showValues);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShowValues}
                className="h-6 w-6 p-0 hover:bg-gray-500 flex-shrink-0"
              >
                {showValues ? (
                  <EyeOff className="h-4 w-4 opacity-70" />
                ) : (
                  <Eye className="h-4 w-4 opacity-70" />
                )}
              </Button>
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