'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Eye, EyeOff, FileText, ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { useBilling } from '@/hooks/useBilling';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';

export function BillingWidget() {
  const [showValues, setShowValues] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const billingData = useBilling();
  const { clients } = useClients();
  const { getPaymentStatus } = usePayments();

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

  // Calcular relatório detalhado
  const getDetailedReport = () => {
    let valoresRecebidos = 0;
    let valoresAReceber = 0;
    let clientesPagos = 0;
    let clientesPendentes = 0;
    let clientesVencidos = 0;

    const clientesDetalhes = clients.map(client => {
      const status = getPaymentStatus(client);
      
      if (status === 'paid') {
        valoresRecebidos += client.serviceValue;
        clientesPagos++;
      } else {
        valoresAReceber += client.serviceValue;
        if (status === 'overdue') {
          clientesVencidos++;
        } else {
          clientesPendentes++;
        }
      }

      return {
        ...client,
        status,
        statusLabel: getStatusLabel(status)
      };
    });

    return {
      valoresRecebidos,
      valoresAReceber,
      clientesPagos,
      clientesPendentes,
      clientesVencidos,
      clientesDetalhes,
      totalMes: valoresRecebidos + valoresAReceber,
      percentualRecebido: billingData.totalMensal > 0 ? (valoresRecebidos / billingData.totalMensal) * 100 : 0
    };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'due_today': return 'Vence Hoje';
      case 'overdue': return 'Vencido';
      case 'pending': return 'Pendente';
      default: return 'Indefinido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'due_today': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const detailedReport = getDetailedReport();

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
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowDetailedReport(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Relatório Completo
            </Button>
          </div>
        </div>

        {/* Relatório Detalhado */}
        {showDetailedReport && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-bold">Relatório Financeiro Detalhado</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailedReport(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Resumo Geral */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600 dark:text-green-400">
                        Valores Recebidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(detailedReport.valoresRecebidos)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {detailedReport.clientesPagos} clientes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-600 dark:text-orange-400">
                        Valores a Receber
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(detailedReport.valoresAReceber)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {detailedReport.clientesPendentes + detailedReport.clientesVencidos} clientes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-600 dark:text-blue-400">
                        Percentual Recebido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {detailedReport.percentualRecebido.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Do total mensal
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown por Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                      {detailedReport.clientesPagos}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Pagos</div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {detailedReport.clientesPendentes}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Pendentes</div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg text-center">
                    <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                      {detailedReport.clientesVencidos}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">Vencidos</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <DollarSign className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(detailedReport.totalMes)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>

                {/* Lista Detalhada de Clientes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalhamento por Cliente</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {detailedReport.clientesDetalhes.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(client.status)}
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Vencimento: dia {client.paymentDueDate}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(client.serviceValue)}
                          </div>
                          <div className={`text-sm font-medium ${
                            client.status === 'paid' ? 'text-green-600' :
                            client.status === 'overdue' ? 'text-red-600' :
                            client.status === 'due_today' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {client.statusLabel}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}