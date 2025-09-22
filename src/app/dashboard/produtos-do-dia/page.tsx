'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, DailyNotification } from '@/hooks/useNotifications';
import { useProductRequests } from '@/hooks/useProductRequests';
import { CheckCircle, Package, Calendar, Bell, BellOff, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ProdutosDoDiaPage() {
  const { getTodayProductRequests, notificationsEnabled, toggleNotifications, notificationTime, setNotificationTime } = useNotifications();
  const { approvedProducts } = useProductRequests();
  const [dailyNotification, setDailyNotification] = useState<DailyNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTodayProducts();
  }, []);

  const loadTodayProducts = async () => {
    try {
      setIsLoading(true);
      const notification = await getTodayProductRequests();
      setDailyNotification(notification);
    } catch (error) {
      console.error('Erro ao carregar produtos do dia:', error);
      toast.error('Erro ao carregar produtos do dia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProduct = (clientId: string, product: string) => {
    const key = `${clientId}-${product}`;
    const newChecked = new Set(checkedProducts);
    
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    
    setCheckedProducts(newChecked);
    
    // Salvar no localStorage
    localStorage.setItem('checkedProducts', JSON.stringify(Array.from(newChecked)));
  };

  const handleToggleNotifications = async () => {
    const success = await toggleNotifications(!notificationsEnabled);
    if (success) {
      toast.success(notificationsEnabled ? 'Notificações desativadas' : 'Notificações ativadas');
    } else {
      toast.error('Erro ao configurar notificações');
    }
  };

  // Carregar produtos marcados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('checkedProducts');
    if (saved) {
      try {
        setCheckedProducts(new Set(JSON.parse(saved)));
      } catch (error) {
        console.error('Erro ao carregar produtos marcados:', error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando produtos do dia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Produtos para Levar Hoje
          </h1>
          <p className="text-gray-600 flex items-center gap-1 mt-1">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Configurações de Notificação */}
        <Card className="w-full sm:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleToggleNotifications}
              >
                {notificationsEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                {notificationsEnabled ? 'Ativado' : 'Ativar'}
              </Button>
              
              {notificationsEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">às</span>
                  <input
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Aprovados das Solicitações */}
      {approvedProducts.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Produtos Aprovados para Levar ({approvedProducts.length} itens)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedProducts.map((request) => (
                <div key={request.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{request.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-500">{request.clientPhone}</span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <div className="flex flex-wrap gap-2">
                      {request.products.map((product, prodIndex) => (
                        <Badge key={prodIndex} variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Produtos por Cliente */}
      {!dailyNotification || dailyNotification.clients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhum produto para levar hoje
            </h3>
            <p className="text-gray-500">
              Todos os clientes estão com produtos em dia!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dailyNotification.clients.map((client) => (
            <Card key={client.clientId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{client.clientName}</span>
                  <Badge variant="outline">
                    {client.products.length} produto(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {client.products.map((product) => {
                    const key = `${client.clientId}-${product}`;
                    const isChecked = checkedProducts.has(key);
                    
                    return (
                      <div
                        key={product}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleToggleProduct(client.clientId, product)}
                      >
                        <span className={`text-sm ${isChecked ? 'line-through text-gray-500' : ''}`}>
                          {product}
                        </span>
                        <CheckCircle 
                          className={`h-5 w-5 ${
                            isChecked 
                              ? 'text-green-600 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Resumo */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Total</span>
                </div>
                <div className="text-sm">
                  {dailyNotification.clients.length} cliente(s) • {' '}
                  {dailyNotification.clients.reduce((sum, client) => sum + client.products.length, 0)} produto(s)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}