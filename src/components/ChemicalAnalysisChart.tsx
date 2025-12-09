'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Visit {
  id: string;
  timestamp: any;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  waterCondition?: string;
}

interface ChemicalAnalysisChartProps {
  visits: Visit[];
}

export function ChemicalAnalysisChart({ visits }: ChemicalAnalysisChartProps) {
  // Preparar dados para o gráfico
  // Pegar as últimas 10 visitas e inverter para ordem cronológica
  const chartData = visits
    .slice(0, 10)
    .reverse()
    .map(visit => {
      let dateStr = '';
      if (visit.timestamp) {
        if (typeof visit.timestamp.toDate === 'function') {
          dateStr = visit.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else if (typeof visit.timestamp === 'string') {
          dateStr = new Date(visit.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
      }

      return {
        date: dateStr,
        pH: visit.ph || 0,
        Cloro: visit.cloro || 0,
        Alcalinidade: visit.alcalinidade ? visit.alcalinidade / 10 : 0, // Escala ajustada
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">Nenhum dado de análise disponível.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Análise Química</CardTitle>
        <CardDescription>Evolução dos parâmetros (Últimas visitas)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pH" fill="#3b82f6" name="pH" />
              <Bar dataKey="Cloro" fill="#22c55e" name="Cloro (ppm)" />
              <Bar dataKey="Alcalinidade" fill="#f59e0b" name="Alcalinidade (/10)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
