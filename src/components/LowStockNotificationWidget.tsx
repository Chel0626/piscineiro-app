'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

type LowStockAlert = {
  clientId: string;
  clientName: string;
  productName: string;
  quantity: number;
  minQuantity: number;
};

export function LowStockNotificationWidget() {
  const { clients } = useClients();
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const lastLoadTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchLowStock = async () => {
      if (!auth.currentUser?.uid || clients.length === 0) return;

      // Cache: só recarrega se passou 5 minutos desde última carga
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
      if (now - lastLoadTimeRef.current < CACHE_DURATION) {
        return; // Usa dados em cache
      }

      const alerts: LowStockAlert[] = [];

      // Executar queries em paralelo
      const uid = auth.currentUser.uid; // Garantir que não é null
      const stockPromises = clients.map(async (client) => {
        try {
          const stockRef = collection(db, `users/${uid}/clients/${client.id}/stock`);
          const snapshot = await getDocs(stockRef);
          
          const clientAlerts: LowStockAlert[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const minQuantity = data.minQuantity || 5;
            
            if (data.quantity <= minQuantity) {
              clientAlerts.push({
                clientId: client.id,
                clientName: client.name,
                productName: data.productName || doc.id,
                quantity: data.quantity || 0,
                minQuantity,
              });
            }
          });
          return clientAlerts;
        } catch (error) {
          console.error(`Erro ao buscar estoque do cliente ${client.id}:`, error);
          return [];
        }
      });

      const results = await Promise.all(stockPromises);
      const allAlerts = results.flat();
      
      setLowStockAlerts(allAlerts);
      lastLoadTimeRef.current = now;
    };

    fetchLowStock();
  }, [clients.length]); // lastLoadTime não deve estar nas dependências

  if (lowStockAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-base sm:text-lg text-orange-700 dark:text-orange-400">
            Produtos Acabando ({lowStockAlerts.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockAlerts.slice(0, 5).map((alert, idx) => {
            const percentage = (alert.quantity / alert.minQuantity) * 100;
            return (
              <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {alert.clientName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {alert.productName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    {alert.quantity} restante(s)
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-gray-200" />
              </div>
            );
          })}
          {lowStockAlerts.length > 5 && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              + {lowStockAlerts.length - 5} alertas adicionais
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
