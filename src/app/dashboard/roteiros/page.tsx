'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
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
import { VisitModal, InventoryItem, CalculatorData, VisitLog } from '@/components/VisitModal';
import { RouteList, RouteClient, RouteClientState } from '@/components/RouteList';

// Tipagem para os clientes
type Client = ClientFormData & { id: string; state: RouteClientState; checkInTime?: string; checkOutTime?: string; durationMinutes?: number };

const daysOfWeek = [
  { key: 'Segunda-feira', label: 'Segunda', short: 'SEG' },
  { key: 'Terça-feira', label: 'Terça', short: 'TER' },
  { key: 'Quarta-feira', label: 'Quarta', short: 'QUA' },
  { key: 'Quinta-feira', label: 'Quinta', short: 'QUI' },
  { key: 'Sexta-feira', label: 'Sexta', short: 'SEX' },
  { key: 'Sábado', label: 'Sábado', short: 'SAB' },
  { key: 'Domingo', label: 'Domingo', short: 'DOM' },
];

// --- Removido SortableClientItem: agora usamos RouteList

// --- Componente principal da página ---
export default function RoteirosPage() {
  const { groupedClients, isLoading } = useRoutines();
  // Estado local para gerenciar a ordem dos clientes de cada dia
  const [localGroupedClients, setLocalGroupedClients] = useState<Record<string, Client[]>>(groupedClients as Record<string, Client[]>);
  // Estado para controlar quais dias estão expandidos (pode ter vários abertos ao mesmo tempo)
  const [expandedDays, setExpandedDays] = useState<string[]>([daysOfWeek[0].key]);
  // Estado para o modal de registrar visita
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitModalCheckInTime, setVisitModalCheckInTime] = useState<string>('');
  const [visitModalInventory, setVisitModalInventory] = useState<InventoryItem[]>([]);
  const [visitModalCalculatorData, setVisitModalCalculatorData] = useState<CalculatorData | undefined>(undefined);

  // Sincroniza o estado local quando os dados do Firebase são carregados
  useEffect(() => {
    setLocalGroupedClients(groupedClients as Record<string, Client[]>);
  }, [groupedClients]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  // Funções para fluxo de estados dos cards
  const handleCheckIn = (clientId: string, checkInTime: string) => {
    setVisitModalCheckInTime(checkInTime);
    setSelectedClientId(clientId);
    setVisitModalOpen(false);
    // Aqui você pode atualizar localGroupedClients ou persistir check-in
  };

  const handleCheckOut = (clientId: string, checkOutTime: string) => {
    setSelectedClientId(clientId);
    setVisitModalOpen(true);
    // Buscar inventário do cliente (mock ou integração real)
    setVisitModalInventory([
      { item_id: 'prod_01', name: 'Cloro Granulado', qty: 300, unit: 'g' },
      { item_id: 'prod_02', name: 'Barrilha', qty: 100, unit: 'g' },
      { item_id: 'prod_03', name: 'Limpa Bordas', qty: 50, unit: 'ml' }
    ]);
    // Buscar dados recentes da calculadora (mock ou integração real)
    setVisitModalCalculatorData({ ph: 7.4, chlorine_ppm: 1.0, alkalinity_ppm: 80, timestamp: new Date().toISOString() });
    const foundClient = (localGroupedClients[Object.keys(localGroupedClients)[0]] as Client[]).find(c => c.id === clientId);
    setVisitModalCheckInTime(foundClient?.checkInTime ?? new Date().toISOString());
  };

  const handleOpenTools = (clientId: string) => {
    // Abre calculadora ou estoque
    // Implemente conforme integração
  };

  const handleVisitSubmit = async (visitLog: VisitLog) => {
    if (!selectedClientId) return;
    try {
      // Salvar log da visita no Firestore
      const visitsCollectionRef = collection(db, 'clients', selectedClientId, 'visits');
      await addDoc(visitsCollectionRef, visitLog);
      // Atualizar inventário do cliente (mock: apenas exibe toast)
      toast.success('Visita registrada e inventário atualizado!');
      setVisitModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      toast.error('Não foi possível registrar a visita.');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent, dayKey: string) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const clientsForDay = localGroupedClients[dayKey] || [];
      const oldIndex = clientsForDay.findIndex(c => c.id === active.id);
      const newIndex = clientsForDay.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedClients = arrayMove(clientsForDay, oldIndex, newIndex);
        
        // Atualizar estado local imediatamente
        setLocalGroupedClients(prev => ({
          ...prev,
          [dayKey]: reorderedClients,
        }));

        // Salvar a nova ordem no Firestore
        try {
          const updatePromises = reorderedClients.map((client, index) => {
            const clientRef = doc(db, 'clients', client.id);
            return updateDoc(clientRef, {
              [`routeOrder.${dayKey}`]: index
            });
          });

          await Promise.all(updatePromises);
          toast.success("Ordem da rota salva!");
        } catch (error) {
          console.error('Erro ao salvar ordem:', error);
          toast.error("Erro ao salvar a ordem. Tente novamente.");
        }
      }
    }
  }

  if (isLoading) {
    return <div>Carregando roteiros...</div>;
  }
  
  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Roteiros da Semana</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Clique em um dia para expandir e reordene sua rota. Inicie e registre visitas conforme o fluxo profissional.
          </p>
        </div>
        {/* Lista de clientes por dia usando RouteList */}
        {daysOfWeek.map(day => {
          const dayClients = localGroupedClients[day.key] || [];
          const isExpanded = expandedDays.includes(day.key);
          return (
            <div key={day.key} className="mb-6 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
              <button
                className={`w-full flex items-center justify-between px-4 py-3 text-lg font-bold focus:outline-none transition-colors ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-800'}`}
                onClick={() => toggleDay(day.key)}
                aria-expanded={isExpanded}
              >
                <span>{day.label}</span>
                <span className={`ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {isExpanded && (
                <div className="p-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={event => handleDragEnd(event, day.key)}
                  >
                    <SortableContext
                      items={dayClients.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <RouteList
                        clients={dayClients}
                        onCheckIn={handleCheckIn}
                        onCheckOut={handleCheckOut}
                        onOpenTools={handleOpenTools}
                      />
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          );
        })}
        {/* Modal de registro de visita inteligente */}
        <VisitModal
          open={visitModalOpen}
          onClose={() => setVisitModalOpen(false)}
          onSubmit={handleVisitSubmit}
          clientId={selectedClientId || ''}
          inventory={visitModalInventory}
          lastCalculatorData={visitModalCalculatorData}
          checkInTime={visitModalCheckInTime}
        />
      </div>
    </div>
  );
}