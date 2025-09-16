// src/hooks/useNotifications.ts
'use client';

import { useState, useEffect } from 'react';
import { useRoutines } from './useRoutines';

export interface ProductNotification {
  clientId: string;
  clientName: string;
  products: string[];
}

export interface DailyNotification {
  date: string;
  clients: ProductNotification[];
}

export function useNotifications() {
  const { groupedClients } = useRoutines();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Verificar permissão atual de notificação
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Função para solicitar permissão de notificação
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Função para buscar produtos solicitados pelos clientes do dia
  const getTodayProductRequests = async (): Promise<DailyNotification> => {
    const today = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    const todayClients = groupedClients[dayName] || [];
    const clientsWithProducts: ProductNotification[] = [];

    for (const client of todayClients) {
      try {
        // Buscar produtos solicitados nas últimas visitas
        const response = await fetch(`/api/clients/${client.id}/product-requests`);
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            clientsWithProducts.push({
              clientId: client.id,
              clientName: client.name,
              products: data.products
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao buscar produtos para cliente ${client.name}:`, error);
      }
    }

    return {
      date: today,
      clients: clientsWithProducts
    };
  };

  // Função para enviar notificação
  const sendNotification = (notification: DailyNotification) => {
    if (permission !== 'granted' || notification.clients.length === 0) return;

    const totalClients = notification.clients.length;
    const totalProducts = notification.clients.reduce((sum, client) => sum + client.products.length, 0);

    const notificationOptions: NotificationOptions = {
      body: `${totalClients} cliente(s) com ${totalProducts} produto(s) para levar hoje`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'daily-products',
      requireInteraction: true
    };

    const notif = new Notification('Produtos para Levar Hoje', notificationOptions);
    
    notif.onclick = () => {
      window.focus();
      // Navegar para página de produtos do dia
      window.location.href = '/dashboard/produtos-do-dia';
    };
  };

  // Função para agendar notificação diária
  const scheduleNotification = () => {
    if (!notificationsEnabled || permission !== 'granted') return;

    const now = new Date();
    const [hours, minutes] = notificationTime.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Se a hora já passou hoje, agendar para amanhã
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    setTimeout(async () => {
      const notification = await getTodayProductRequests();
      sendNotification(notification);
      
      // Reagendar para o próximo dia
      scheduleNotification();
    }, timeUntilNotification);
  };

  // Função para ativar/desativar notificações
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    setNotificationsEnabled(enabled);
    
    if (enabled) {
      scheduleNotification();
    }

    // Salvar preferência no localStorage
    localStorage.setItem('notificationsEnabled', enabled.toString());
    localStorage.setItem('notificationTime', notificationTime);

    return true;
  };

  // Carregar preferências salvas
  useEffect(() => {
    const savedEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const savedTime = localStorage.getItem('notificationTime') || '08:00';
    
    setNotificationsEnabled(savedEnabled);
    setNotificationTime(savedTime);
    
    if (savedEnabled && permission === 'granted') {
      scheduleNotification();
    }
  }, [permission]);

  return {
    notificationsEnabled,
    notificationTime,
    permission,
    setNotificationTime,
    toggleNotifications,
    requestNotificationPermission,
    getTodayProductRequests,
    sendNotification
  };
}