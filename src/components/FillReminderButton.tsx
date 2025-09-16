'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FillReminder, FillReminderState } from './FillReminder';
import { Droplets, CheckCircle } from 'lucide-react';

interface FillReminderButtonProps {
  onStateChange: (state: FillReminderState) => void;
}

export function FillReminderButton({ onStateChange }: FillReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminderState, setReminderState] = useState<FillReminderState>({
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
    isCompleted: false
  });

  const handleStateChange = (state: FillReminderState) => {
    setReminderState(state);
    onStateChange(state);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const buttonContent = useMemo(() => {
    if (reminderState.isCompleted) {
      return (
        <>
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="ml-3">Abastecimento OK</span>
        </>
      );
    }
    
    if (reminderState.isActive) {
      return (
        <>
          <div className="relative">
            <Droplets className="h-5 w-5 text-blue-600 animate-bounce" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          </div>
          <span className="ml-3 font-mono">{formatTime(reminderState.timeRemaining)}</span>
        </>
      );
    }
    
    return (
      <>
        <Droplets className="h-5 w-5" />
        <span className="ml-3">Abastecimento</span>
      </>
    );
  }, [reminderState.isCompleted, reminderState.isActive, reminderState.timeRemaining]);

  const buttonClassName = useMemo(() => {
    const baseClass = "w-full justify-start px-4 py-2 mt-2 rounded-lg transition-all duration-300 h-auto relative overflow-hidden";
    
    if (reminderState.isCompleted) {
      return `${baseClass} bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800`;
    }
    
    if (reminderState.isActive) {
      return `${baseClass} bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 animate-pulse`;
    }
    
    return `${baseClass} text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white`;
  }, [reminderState.isCompleted, reminderState.isActive]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={buttonClassName}
        >
          {buttonContent}
          
          {/* Barra de progresso */}
          {reminderState.isActive && reminderState.totalTime > 0 && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((reminderState.totalTime - reminderState.timeRemaining) / reminderState.totalTime) * 100}%` 
              }}
            />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Lembrete de Abastecimento
          </DialogTitle>
          <DialogDescription>
            Configure o tempo para encher a piscina e receba um alerta quando estiver pronto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <FillReminder onStateChange={handleStateChange} />
        </div>
      </DialogContent>
    </Dialog>
  );
}