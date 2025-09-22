'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const { isOnline } = useServiceWorker();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-4 right-4 w-auto z-50 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        Você está offline. Algumas funcionalidades podem estar limitadas.
      </AlertDescription>
    </Alert>
  );
}