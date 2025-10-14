'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRoutines } from '@/hooks/useRoutines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, GripVertical, Calendar, Plus } from 'lucide-react';
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
import { VisitForm, VisitFormData } from '@/components/VisitForm';

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
function SortableClientItem({ client, onClientClick }: { client: Client; onClientClick: (client: Client) => void }) {
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
      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
    >
      <button 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </button>
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer group"
          onClick={() => onClientClick(client)}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {client.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {`${client.address}, ${client.neighborhood}`}
          </p>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onClientClick(client)}
        className="h-10 w-10 p-0 border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400"
        title="Registrar visita"
      >
        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </Button>
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
  // Estado para o modal de registrar visita
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza o estado local quando os dados do Firebase são carregados
  useEffect(() => {
    setLocalGroupedClients(groupedClients);
  }, [groupedClients]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
  };

  const handleVisitSubmit = async (data: VisitFormData) => {
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const visitsCollectionRef = collection(db, 'clients', selectedClient.id, 'visits');
      await addDoc(visitsCollectionRef, {
        ...data,
        timestamp: serverTimestamp(),
      });
      toast.success('Visita registrada com sucesso!');
      setSelectedClient(null);
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível registrar a visita.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full h-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Roteiros da Semana
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Selecione um dia e arraste os clientes para reordenar sua rota de visitas.
            </p>
          </div>

          {/* Botões dos dias da semana - Grid unificado */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {daysOfWeek.map((day) => {
              const clientsCount = localGroupedClients[day.key]?.length || 0;
              const isSelected = selectedDay === day.key;
              return (
                <Button
                  key={day.key}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedDay(day.key)}
                  className={`
                    relative flex flex-col items-center justify-center
                    h-20 sm:h-24 p-3 sm:p-4
                    transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg scale-105' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2'
                    }
                  `}
                >
                  <span className="font-bold text-sm sm:text-base mb-1">
                    {day.short}
                  </span>
                  <span className="text-xs opacity-80 hidden sm:block">
                    {day.label}
                  </span>
                  {clientsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                      {clientsCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Card do dia selecionado */}
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span>{selectedDayInfo?.label}</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                {selectedDayClients.length} cliente(s) agendado(s) para hoje
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {selectedDayClients.length > 0 ? (
                <SortableContext
                  items={selectedDayClients.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-3">
                    {selectedDayClients.map((client) => (
                      <SortableClientItem key={client.id} client={client} onClientClick={handleClientClick} />
                    ))}
                  </ul>
                </SortableContext>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-base text-gray-500 dark:text-gray-400">
                    Nenhum cliente agendado para {selectedDayInfo?.label}.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Os clientes aparecerão aqui quando forem cadastrados para este dia.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Modal para registrar visita */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Registrar Visita</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Registrar nova visita para <span className="font-semibold">{selectedClient?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {selectedClient && (
                <VisitForm 
                  onSubmit={handleVisitSubmit} 
                  isLoading={isSubmitting}
                  clientId={selectedClient.id} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </DndContext>
  );
}