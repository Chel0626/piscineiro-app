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
      className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 p-2 sm:p-3 lg:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
    >
      <button 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 lg:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
      >
        <GripVertical className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-400 dark:text-gray-500" />
      </button>
      
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-1 min-w-0">
        <div className="bg-blue-100 dark:bg-blue-900 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg flex-shrink-0">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer group"
          onClick={() => onClientClick(client)}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm lg:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {client.name}
          </p>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
            {`${client.address}, ${client.neighborhood}`}
          </p>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onClientClick(client)}
        className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 p-0 border hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 flex-shrink-0"
        title="Registrar visita"
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
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

  const handleDayClick = (dayKey: string) => {
    // Toggle: se clicar no dia já selecionado, recolhe (limpa a seleção)
    setSelectedDay(prev => prev === dayKey ? '' : dayKey);
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
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full min-h-screen p-2 sm:p-3 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white">
              Roteiros da Semana
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Clique em um dia para expandir e arraste os clientes para reordenar sua rota.
            </p>
          </div>

          {/* Cards expansíveis dos dias da semana */}
          <div className="space-y-2">
            {daysOfWeek.map((day) => {
              const clientsForDay = localGroupedClients[day.key] || [];
              const clientsCount = clientsForDay.length;
              const isExpanded = selectedDay === day.key;
              
              return (
                <Card 
                  key={day.key} 
                  className={`
                    transition-all duration-300 overflow-hidden
                    ${isExpanded 
                      ? 'shadow-lg border-2 border-blue-500 dark:border-blue-600' 
                      : 'shadow-sm hover:shadow-md border-2 border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  {/* Header do dia - sempre visível */}
                  <button
                    onClick={() => handleDayClick(day.key)}
                    className="w-full text-left"
                  >
                    <CardHeader className={`
                      p-2.5 sm:p-3 lg:p-4 xl:p-5 transition-all duration-300
                      ${isExpanded 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-750 dark:hover:to-gray-800'
                      }
                    `}>
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-1">
                          <Calendar className={`
                            h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-colors flex-shrink-0
                            ${isExpanded ? 'text-white' : 'text-blue-600 dark:text-blue-400'}
                          `} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className={`
                              text-sm sm:text-base lg:text-lg xl:text-xl transition-colors truncate
                              ${isExpanded ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
                            `}>
                              {day.label}
                            </CardTitle>
                            <CardDescription className={`
                              text-[10px] sm:text-xs lg:text-sm mt-0.5 transition-colors truncate
                              ${isExpanded ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}
                            `}>
                              {clientsCount === 0 ? 'Nenhum' : `${clientsCount} ${clientsCount > 1 ? 'clientes' : 'cliente'}`}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
                          {clientsCount > 0 && (
                            <span className={`
                              text-[10px] sm:text-xs lg:text-sm font-bold rounded-full 
                              h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8
                              flex items-center justify-center shadow-md transition-colors
                              ${isExpanded 
                                ? 'bg-white text-blue-600' 
                                : 'bg-orange-500 text-white'
                              }
                            `}>
                              {clientsCount}
                            </span>
                          )}
                          <svg
                            className={`
                              h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 transition-all duration-300 flex-shrink-0
                              ${isExpanded 
                                ? 'text-white rotate-180' 
                                : 'text-gray-600 dark:text-gray-400'
                              }
                            `}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Conteúdo expansível - lista de clientes */}
                  <div 
                    className={`
                      transition-all duration-300 ease-in-out overflow-hidden
                      ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <CardContent className="p-2 sm:p-3 lg:p-4 bg-white dark:bg-gray-900">
                      {clientsForDay.length > 0 ? (
                        <SortableContext
                          items={clientsForDay.map(c => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <ul className="space-y-2">
                            {clientsForDay.map((client) => (
                              <SortableClientItem key={client.id} client={client} onClientClick={handleClientClick} />
                            ))}
                          </ul>
                        </SortableContext>
                      ) : (
                        <div className="text-center py-4 sm:py-6 lg:py-8">
                          <MapPin className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                            Nenhum cliente agendado
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>

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