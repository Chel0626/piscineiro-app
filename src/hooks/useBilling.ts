'use client';

import { useClients } from './useClients';
import { usePayments } from './usePayments';
import { ClientWithPayment } from '@/lib/validators/clientSchema';

export interface BillingData {
  totalMensal: number;
  totalAnual: number;
  clientesAtivos: number;
  proximoVencimento: string;
  recebimentosPendentes: number;
}

export function useBilling(): BillingData {
  const { clients, authLoading } = useClients();
  const { getPaymentStatus } = usePayments();

  if (authLoading) {
    return {
      totalMensal: 0,
      totalAnual: 0,
      clientesAtivos: 0,
      proximoVencimento: '',
      recebimentosPendentes: 0
    };
  }

  // Calcular faturamento mensal total
  const totalMensal = clients.reduce((total, client) => total + client.serviceValue, 0);

  // Calcular faturamento anual (mensal * 12)
  const totalAnual = totalMensal * 12;

  // Contar clientes ativos
  const clientesAtivos = clients.length;

  // Encontrar próximo vencimento
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const proximoVencimento = calcularProximoVencimento(clients, diaAtual);

  // Contar recebimentos pendentes (clientes com status overdue ou due_today)
  const recebimentosPendentes = clients.filter((client: ClientWithPayment) => {
    const status = getPaymentStatus(client);
    return status === 'overdue' || status === 'due_today';
  }).length;

  return {
    totalMensal,
    totalAnual,
    clientesAtivos,
    proximoVencimento,
    recebimentosPendentes
  };
}

function calcularProximoVencimento(clients: ClientWithPayment[], diaAtual: number): string {
  if (clients.length === 0) return '';

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  // Encontrar próximos vencimentos
  const proximosVencimentos = clients.map(client => {
    let mes = mesAtual;
    let ano = anoAtual;

    // Se o dia de vencimento já passou neste mês, considerar o próximo mês
    if (client.paymentDueDate <= diaAtual) {
      mes += 1;
      if (mes > 11) {
        mes = 0;
        ano += 1;
      }
    }

    return new Date(ano, mes, client.paymentDueDate);
  });

  // Ordenar e pegar o próximo
  proximosVencimentos.sort((a, b) => a.getTime() - b.getTime());
  
  return proximosVencimentos[0]?.toISOString().split('T')[0] || '';
}