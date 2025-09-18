'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, X, ArrowRight } from 'lucide-react';
import { useTemporaryReschedule } from '@/hooks/useTemporaryReschedule';

interface DayRescheduleProps {
  clientId: string;
  clientName: string;
  originalDay: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira', 
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

export function DayReschedule({ clientId, clientName, originalDay, onSuccess, onCancel }: DayRescheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const { rescheduleClient, isLoading, isClientRescheduled } = useTemporaryReschedule();

  const isAlreadyRescheduled = isClientRescheduled(clientId);

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDay || selectedDay === originalDay) {
      return;
    }

    const success = await rescheduleClient(clientId, clientName, originalDay, selectedDay);
    if (success) {
      setIsExpanded(false);
      setSelectedDay('');
      onSuccess?.();
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setSelectedDay('');
    onCancel?.();
  };

  // Se já foi reagendado, mostrar status
  if (isAlreadyRescheduled) {
    return (
      <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Movido para {isAlreadyRescheduled.newDay}
      </div>
    );
  }

  return (
    <div className="relative">
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-xs h-7 px-2"
          disabled={isLoading}
        >
          <Calendar className="mr-1 h-3 w-3" />
          Mover Dia
        </Button>
      ) : (
        <Card className="absolute top-0 left-0 z-50 w-80 shadow-lg border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Mover para outro dia</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Selecione o dia para onde deseja mover <strong>{clientName}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDaySelect(day)}
                  disabled={day === originalDay}
                  className={`justify-start text-xs h-8 ${
                    day === originalDay 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {day}
                  {day === originalDay && ' (dia atual)'}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1 text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReschedule}
                disabled={!selectedDay || selectedDay === originalDay || isLoading}
                className="flex-1 text-xs h-8"
              >
                {isLoading ? (
                  'Movendo...'
                ) : (
                  <>
                    <ArrowRight className="mr-1 h-3 w-3" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}