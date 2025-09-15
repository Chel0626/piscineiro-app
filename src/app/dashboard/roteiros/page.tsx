'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRoutines } from '@/hooks/useRoutines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, GripVertical } from 'lucide-react';
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

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

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
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <button {...listeners} className="cursor-grab touch-none p-1">
        <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </button>
      <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-gray-900 dark:text-gray-100">{client.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
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
      // Encontra em qual dia o item foi movido
      const dayKey = Object.keys(localGroupedClients).find(day => 
        localGroupedClients[day].some(client => client.id === active.id)
      );

      if (dayKey) {
        setLocalGroupedClients(prev => {
          const clientsForDay = prev[dayKey];
          const oldIndex = clientsForDay.findIndex(c => c.id === active.id);
          const newIndex = clientsForDay.findIndex(c => c.id === over.id);
          
          return {
            ...prev,
            [dayKey]: arrayMove(clientsForDay, oldIndex, newIndex),
          };
        });
        toast.success("Ordem da rota atualizada!");
      }
    }
  }

  if (isLoading) {
    return <div>Carregando roteiros...</div>;
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Roteiros da Semana</h1>
          <p className="text-muted-foreground">
            Arraste os clientes para reordenar sua rota de visitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daysOfWeek.map((day) => {
            const clientsForDay = localGroupedClients[day] || [];
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                  <CardDescription>
                    {clientsForDay.length} cliente(s) agendado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsForDay.length > 0 ? (
                    <SortableContext
                      items={clientsForDay.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-3">
                        {clientsForDay.map((client) => (
                          <SortableClientItem key={client.id} client={client} />
                        ))}
                      </ul>
                    </SortableContext>
                  ) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                      Nenhum cliente agendado.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}