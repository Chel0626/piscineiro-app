'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, CheckCircle, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, storage, auth } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DayReschedule } from '@/components/DayReschedule';
import { useTemporaryReschedule } from '@/hooks/useTemporaryReschedule';
import { format, startOfDay, endOfDay } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
};

type DailyClient = ClientFormData & { 
  id: string;
  isRescheduled?: boolean;
  originalDay?: string;
};

// Componente interno para item arrastável
function SortableClientCard({ 
  client, 
  isCompleted,
  isExpanded,
  onToggleExpand,
  onCheckout,
  onFinalize,
  isLoading
}: { 
  client: DailyClient;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCheckout: () => void;
  onFinalize: () => void;
  isLoading: boolean;
}) {
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

  const today = getCurrentDayName();

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-col rounded-lg transition-all overflow-hidden border ${
        client.isRescheduled
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500'
          : isCompleted
          ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-500'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Cabeçalho clicável - toda área é clicável para expandir/recolher */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/50 active:bg-white/80 dark:active:bg-gray-700/80 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Indicador visual circular com seta */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-base text-gray-900 dark:text-gray-100">
                {client.name || `Cliente ${client.id}`}
              </p>
              {client.isRescheduled && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full shrink-0">
                  <UserPlus className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Reagendado
                  </span>
                </div>
              )}
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {client.neighborhood}
              {client.isRescheduled && client.originalDay && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (movido de {client.originalDay})
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Indicador de arrastar (apenas visual) */}
        <div 
          {...attributes}
          {...listeners}
          className="flex flex-col gap-1 p-2 cursor-move hover:bg-gray-200 dark:hover:bg-gray-600 rounded shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        </div>
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="p-3 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm space-y-1">
            <div><strong>Telefone:</strong> {client.phone || 'Não informado'}</div>
            <div><strong>Endereço:</strong> {client.address || 'Não informado'}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onCheckout();
              }}
              disabled={isLoading}
              className="flex-1 min-w-[140px]"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Registro de Visita
            </Button>

            {!client.isRescheduled && (
              <DayReschedule
                clientId={client.id}
                clientName={client.name}
                originalDay={today}
              />
            )}

            {!isCompleted && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalize();
                }}
                disabled={isLoading}
                className="flex-1 min-w-[140px]"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function DailyRouteWidget() {
  const { clients, authLoading } = useClients();
  const { getClientsForDay, isClientMovedAway } = useTemporaryReschedule();
  
  // Estados
  const [visitedToday, setVisitedToday] = useState<Set<string>>(new Set());
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<string[]>([]);
  
  // Modal de checkout
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Modal de finalização
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [selectedClientForFinalize, setSelectedClientForFinalize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const today = getCurrentDayName();

  // Carregar visitas do dia
  useEffect(() => {
    const loadVisitedToday = async () => {
      if (!auth.currentUser?.uid) return;

      const visitsRef = collection(db, `users/${auth.currentUser.uid}/visits`);
      const q = query(
        visitsRef,
        where('date', '>=', startOfDay(new Date())),
        where('date', '<=', endOfDay(new Date()))
      );

      const snapshot = await getDocs(q);
      const visitedIds = new Set<string>();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.clientId) {
          visitedIds.add(data.clientId);
        }
      });
      setVisitedToday(visitedIds);
    };

    if (!authLoading) {
      loadVisitedToday();
    }
  }, [authLoading]);

  // Carregar ordem salva
  useEffect(() => {
    const loadOrder = async () => {
      if (!auth.currentUser?.uid) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const orderRef = doc(db, `users/${auth.currentUser.uid}/clientOrders/${today}`);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        setItems(orderDoc.data().order);
      } else {
        // Inicializar com ordem padrão
        const originalClients = clients.filter(client => {
          if (client.visitDays) {
            return client.visitDays.includes(getCurrentDayName());
          }
          const legacyClient = client as ClientFormData & { visitDay?: string };
          return legacyClient.visitDay === getCurrentDayName();
        }).filter(client => !isClientMovedAway(client.id, getCurrentDayName()));

        const rescheduledForToday = getClientsForDay(getCurrentDayName());
        const allIds = [
          ...originalClients.map(c => c.id),
          ...rescheduledForToday.map(r => r.clientId)
        ];
        setItems(allIds);
      }
    };

    if (!authLoading && clients.length > 0) {
      loadOrder();
    }
  }, [authLoading, clients, getClientsForDay, isClientMovedAway]);

  // Salvar ordem quando mudar
  useEffect(() => {
    const saveOrder = async () => {
      if (!auth.currentUser?.uid || items.length === 0) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const orderRef = doc(db, `users/${auth.currentUser.uid}/clientOrders/${today}`);
      await setDoc(orderRef, {
        order: items,
        updatedAt: new Date()
      });
    };

    if (items.length > 0) {
      saveOrder();
    }
  }, [items]);

  // Obter clientes do dia
  const allDailyClients: DailyClient[] = (() => {
    const originalClients = clients.filter(client => {
      if (client.visitDays) {
        return client.visitDays.includes(today);
      }
      const legacyClient = client as ClientFormData & { visitDay?: string };
      return legacyClient.visitDay === today;
    }).filter(client => !isClientMovedAway(client.id, today));

    const rescheduledForToday = getClientsForDay(today);
    const rescheduledClients: DailyClient[] = [];
    
    rescheduledForToday.forEach(reschedule => {
      const client = clients.find(c => c.id === reschedule.clientId);
      if (client) {
        rescheduledClients.push({ 
          ...client, 
          isRescheduled: true as const, 
          originalDay: reschedule.originalDay 
        });
      }
    });

    return [...originalClients, ...rescheduledClients];
  })();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleCheckout = (clientId: string) => {
    setSelectedClientId(clientId);
    setCheckoutModalOpen(true);
  };

  const openFinalizeModal = (clientId: string) => {
    setSelectedClientForFinalize(clientId);
    setFinalizeModalOpen(true);
  };

  const closeFinalizeModal = () => {
    setFinalizeModalOpen(false);
    setSelectedClientForFinalize(null);
  };

  const handleFinalizeWithPhoto = async () => {
    if (!selectedClientForFinalize || !auth.currentUser?.uid) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Determina a extensão do arquivo baseada no tipo MIME
      const fileExtension = file.type === 'image/png' ? 'png' : 
                           file.type === 'image/gif' ? 'gif' :
                           file.type === 'image/webp' ? 'webp' : 'jpg';
      
      // Cria um nome de arquivo seguro usando apenas timestamp e extensão
      const timestamp = Date.now();
      const safeFileName = `visit_${timestamp}.${fileExtension}`;
      
      const photoRef = storageRef(
        storage, 
        `users/${auth.currentUser.uid}/clients/${selectedClientForFinalize}/visits/${safeFileName}`
      );
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      await addDoc(collection(db, `users/${auth.currentUser.uid}/visits`), {
        clientId: selectedClientForFinalize,
        date: new Date(),
        photoURL,
        timestamp: Timestamp.now(),
      });

      setVisitedToday(prev => new Set(prev).add(selectedClientForFinalize));
      closeFinalizeModal();
    } catch (error) {
      console.error('Erro ao finalizar com foto:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openCheckoutFromFinalize = () => {
    if (selectedClientForFinalize) {
      handleCheckout(selectedClientForFinalize);
      closeFinalizeModal();
    }
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Roteiro do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar clientes conforme ordem salva
  const orderedClients = items
    .map(id => allDailyClients.find(c => c.id === id))
    .filter((c): c is DailyClient => c !== null);

  const pendingClients = orderedClients.filter(c => !visitedToday.has(c.id));
  const completedClients = orderedClients.filter(c => visitedToday.has(c.id));

  const displayedPendingClients = showAllPending ? pendingClients : pendingClients.slice(0, 3);
  const displayedCompletedClients = showAllCompleted ? completedClients : completedClients.slice(0, 3);

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg">Roteiro de Hoje ({today})</CardTitle>
              <CardDescription className="text-sm">
                {pendingClients.length > 0
                  ? `${pendingClients.length} pendente(s) • ${completedClients.length} concluído(s)`
                  : allDailyClients.length > 0 
                    ? 'Todas as visitas concluídas! 🎉'
                    : 'Sem visitas agendadas'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar' : 'Expandir'}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            {/* Clientes pendentes */}
            {pendingClients.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={displayedPendingClients.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-3">
                      {displayedPendingClients.map(client => (
                        <SortableClientCard
                          key={client.id}
                          client={client}
                          isCompleted={false}
                          isExpanded={expandedClients.has(client.id)}
                          onToggleExpand={() => toggleClientExpansion(client.id)}
                          onCheckout={() => handleCheckout(client.id)}
                          onFinalize={() => openFinalizeModal(client.id)}
                          isLoading={loadingClientId === client.id}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
                {!showAllPending && pendingClients.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllPending(true)}
                    className="w-full"
                  >
                    Mostrar todos ({pendingClients.length - 3} restantes)
                  </Button>
                )}
              </div>
            )}

            {/* Clientes concluídos */}
            {completedClients.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídos</h4>
                <ul className="space-y-3">
                  {displayedCompletedClients.map(client => (
                    <SortableClientCard
                      key={client.id}
                      client={client}
                      isCompleted={true}
                      isExpanded={expandedClients.has(client.id)}
                      onToggleExpand={() => toggleClientExpansion(client.id)}
                      onCheckout={() => handleCheckout(client.id)}
                      onFinalize={() => openFinalizeModal(client.id)}
                      isLoading={loadingClientId === client.id}
                    />
                  ))}
                </ul>
                {!showAllCompleted && completedClients.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllCompleted(true)}
                    className="w-full"
                  >
                    Mostrar todos ({completedClients.length - 3} restantes)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de finalização */}
      <Dialog open={finalizeModalOpen} onOpenChange={closeFinalizeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Foto da visita (opcional)</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="w-full"
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleFinalizeWithPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? 'Enviando...' : 'Finalizar com Foto'}
            </Button>
            <Button 
              variant="default" 
              className="w-full"
              onClick={openCheckoutFromFinalize}
            >
              Registrar Atividades
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        clientId={selectedClientId}
      />
    </>
  );
}
