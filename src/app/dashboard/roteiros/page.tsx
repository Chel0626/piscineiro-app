'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRoutines } from '@/hooks/useRoutines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, GripVertical, Calendar } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientFormData } from '@/lib/validators/clientSchema';

// Tipagem para os clientes
type Client = ClientFormData & { id: string; };

const daysOfWeek = [
  { key: 'Segunda-feira', label: 'Segunda', short: 'SEG' },
  { key: 'Terça-feira', label: 'Terça', short: 'TER' },
  { key: 'Quarta-feira', label: 'Quarta', short: 'QUA' },
  { key: 'Quinta-feira', label: 'Quinta', short: 'QUI' },
  { key: 'Sexta-feira', label: 'Sexta', short: 'SEX' },
  { key: 'Sábado', label: 'Sábado', short: 'SAB' },
  { key: 'Domingo', label: 'Domingo', short: 'DOM' },
];

// --- Componente para cada item arrastável ---
function SortableClientItem({ client }: { client: Client }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <button {...listeners} className="cursor-grab touch-none p-1 flex-shrink-0">
        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
      </button>
      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-gray-900 dark:text-gray-100 text-sm sm:text-base">{client.name}</p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
          {`${client.address}, ${client.neighborhood}`}
        </p>
      </div>
    </li>
  );
}

// --- Componente principal da página ---
export default function RoteirosPage() {
  const { groupedClients, isLoading } = useRoutines();
  // Estado local para gerenciar a ordem dos clientes de cada dia
  const [localGroupedClients, setLocalGroupedClients] = useState(groupedClients);
  // Estado para controlar qual dia está selecionado
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0].key);

  // Sincroniza o estado local quando os dados do Firebase são carregados
  useEffect(() => {
    setLocalGroupedClients(groupedClients);
  }, [groupedClients]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Trabalha apenas com o dia selecionado
      setLocalGroupedClients(prev => {
        const clientsForDay = prev[selectedDay] || [];
        const oldIndex = clientsForDay.findIndex(c => c.id === active.id);
        const newIndex = clientsForDay.findIndex(c => c.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return {
            ...prev,
            [selectedDay]: arrayMove(clientsForDay, oldIndex, newIndex),
          };
        }
        return prev;
      });
      toast.success("Ordem da rota atualizada!");
    }
  }

  if (isLoading) {
    return <div>Carregando roteiros...</div>;
  }

  const selectedDayClients = localGroupedClients[selectedDay] || [];
  const selectedDayInfo = daysOfWeek.find(day => day.key === selectedDay);
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="px-2 sm:px-0">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Roteiros da Semana</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Selecione um dia e arraste os clientes para reordenar sua rota de visitas.
          </p>
        </div>

        {/* Botões dos dias da semana */}
        <div className="mb-4 sm:mb-6 px-2 sm:px-0">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {daysOfWeek.map((day) => {
              const clientsCount = localGroupedClients[day.key]?.length || 0;
              const isSelected = selectedDay === day.key;
              
              return (
                <Button
                  key={day.key}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedDay(day.key)}
                  className="flex flex-col h-16 px-2 py-2 relative w-full text-center"
                >
                  <span className="font-medium text-xs sm:text-sm">{day.short}</span>
                  <span className="text-xs opacity-75 hidden sm:block">{day.label}</span>
                  {clientsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {clientsCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Card do dia selecionado */}
        <Card className="mx-2 sm:mx-0">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              {selectedDayInfo?.label}
            </CardTitle>
            <CardDescription className="text-sm">
              {selectedDayClients.length} cliente(s) agendado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {selectedDayClients.length > 0 ? (
              <SortableContext
                items={selectedDayClients.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2 sm:space-y-3">
                  {selectedDayClients.map((client) => (
                    <SortableClientItem key={client.id} client={client} />
                  ))}
                </ul>
              </SortableContext>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum cliente agendado para {selectedDayInfo?.label}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DndContext>
  );
}