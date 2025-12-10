'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Visit {
  id: string;
  timestamp: string;
  ph?: number;
  cloro?: number;
  alcalinidade?: number;
  waterCondition?: string;
}

interface ParametersChartProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ParametersChart({ clientId, isOpen, onClose }: ParametersChartProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      loadVisits();
    }
  }, [isOpen, clientId]);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/visits`);
      if (response.ok) {
        const data = await response.json();
        // Inverter para mostrar do mais antigo para o mais recente no gráfico
        setVisits(data.visits.reverse());
      }
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = visits.map(visit => ({
    date: visit.timestamp ? new Date(visit.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
    pH: visit.ph || null,
    Cloro: visit.cloro || null,
    Alcalinidade: visit.alcalinidade ? visit.alcalinidade / 10 : null, // Dividir por 10 para escala visual
  })).filter(item => item.pH !== null || item.Cloro !== null || item.Alcalinidade !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gráfico de Evolução dos Parâmetros</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Carregando dados...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Nenhum registro de visita encontrado.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico de pH */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">pH</CardTitle>
                <CardDescription>Ideal: 7.2 - 7.6</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[6.5, 8.5]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="pH" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        connectNulls
                      />
                      {/* Linhas de referência ideal */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 7.2} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Mínimo ideal"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 7.6} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Máximo ideal"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Cloro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cloro Livre (ppm)</CardTitle>
                <CardDescription>Ideal: 1.0 - 3.0 ppm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="Cloro" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', r: 4 }}
                        connectNulls
                      />
                      {/* Linhas de referência ideal */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 1.0} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Mínimo ideal"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 3.0} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Máximo ideal"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Alcalinidade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alcalinidade (ppm)</CardTitle>
                <CardDescription>Ideal: 80 - 120 ppm (escala dividida por 10 para visualização)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 200]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="Alcalinidade" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        connectNulls
                      />
                      {/* Linhas de referência ideal */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 80} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Mínimo ideal"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 120} 
                        stroke="#22c55e" 
                        strokeDasharray="5 5" 
                        dot={false}
                        name="Máximo ideal"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 text-center">
              Mostrando os últimos {visits.length} registros de visitas
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
