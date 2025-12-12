'use client';

import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ListChecks, CheckCircle, UserPlus, ChevronDown, ChevronUp, RefreshCw, Search, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, setDoc, getDoc, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { ClientFormData } from '@/lib/validators/clientSchema';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DayReschedule } from '@/components/DayReschedule';
import { useTemporaryReschedule } from '@/hooks/useTemporaryReschedule';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
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

const getCurrentDayName = () => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[new Date().getDay()];
};

type DailyClient = ClientFormData & { 
  id: string;
  isRescheduled?: boolean;
  originalDay?: string;
  isTemporary?: boolean;
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
        client.isTemporary
          ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500'
          : client.isRescheduled
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
              {client.isTemporary && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-full shrink-0">
                  <Plus className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Temporário
                  </span>
                </div>
              )}
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
              {client.isTemporary && (
                <span className="ml-2 text-purple-600 dark:text-purple-400">
                  (roteiro temporário)
                </span>
              )}
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
  const isFirstLoad = useRef(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastLoadTimeRef = useRef<number>(0); // Cache timestamp usando ref
  const lastLoadDateRef = useRef<string>(''); // Data da última carga
  
  // Modal de checkout
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Estados para Roteiro Temporário
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [temporaryClients, setTemporaryClients] = useState<Set<string>>(new Set());
  
  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const today = getCurrentDayName();

  // Carregar visitas do dia com cache inteligente
  useEffect(() => {
    const loadVisitedToday = async (forceReload = false) => {
      if (!auth.currentUser?.uid || clients.length === 0) return;

      const now = Date.now();
      const currentDate = new Date().toISOString().split('T')[0];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
      
      // Verifica se mudou de dia - se sim, força reload
      const dayChanged = lastLoadDateRef.current !== currentDate;
      
      // Só recarrega se:
      // 1. Forçado manualmente (forceReload)
      // 2. Mudou de dia
      // 3. Passou o tempo de cache
      if (!forceReload && !dayChanged && (now - lastLoadTimeRef.current < CACHE_DURATION)) {
        return; // Usa dados em cache
      }

      const visitedIds = new Set<string>();
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Criar array de promises para executar em paralelo
      const checkPromises = clients.map(async (client) => {
        const visitsRef = collection(db, 'clients', client.id, 'visits');
        const q = query(
          visitsRef,
          where('date', '>=', todayStart),
          where('date', '<=', todayEnd),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return client.id;
        }
        return null;
      });

      // Executar todas as queries em paralelo
      const results = await Promise.all(checkPromises);
      results.forEach(clientId => {
        if (clientId) visitedIds.add(clientId);
      });

      setVisitedToday(visitedIds);
      lastLoadTimeRef.current = now; // Atualiza timestamp do cache
      lastLoadDateRef.current = currentDate; // Atualiza data do cache
    };

    if (!authLoading && clients.length > 0) {
      loadVisitedToday();
    }
  }, [authLoading, clients.length]); // lastLoadTime não deve estar aqui pois causa loop

  // Função para forçar atualização manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    lastLoadTimeRef.current = 0; // Invalida cache
    
    // Recarregar dados
    if (auth.currentUser?.uid && clients.length > 0) {
      const visitedIds = new Set<string>();
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const checkPromises = clients.map(async (client) => {
        const visitsRef = collection(db, 'clients', client.id, 'visits');
        const q = query(
          visitsRef,
          where('date', '>=', todayStart),
          where('date', '<=', todayEnd),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return client.id;
        }
        return null;
      });

      const results = await Promise.all(checkPromises);
      results.forEach(clientId => {
        if (clientId) visitedIds.add(clientId);
      });

      setVisitedToday(visitedIds);
      lastLoadTimeRef.current = Date.now();
      lastLoadDateRef.current = new Date().toISOString().split('T')[0];
    }
    
    setIsRefreshing(false);
  };

  // Carregar ordem salva
  useEffect(() => {
    const loadOrder = async () => {
      if (!auth.currentUser?.uid) return;

      // Calcular clientes que deveriam estar no roteiro de hoje
      const originalClients = clients.filter(client => {
        if (client.visitDays) {
          return client.visitDays.includes(getCurrentDayName());
        }
        const legacyClient = client as ClientFormData & { visitDay?: string };
        return legacyClient.visitDay === getCurrentDayName();
      }).filter(client => !isClientMovedAway(client.id, getCurrentDayName()));

      const rescheduledForToday = getClientsForDay(getCurrentDayName());
      const currentDayClientIds = [
        ...originalClients.map(c => c.id),
        ...rescheduledForToday.map(r => r.clientId)
      ];

      const today = format(new Date(), 'yyyy-MM-dd');
      const orderRef = doc(db, `users/${auth.currentUser.uid}/clientOrders/${today}`);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        isFirstLoad.current = true;
        const savedOrder = orderDoc.data().order as string[];
        
        // Mesclar ordem salva com clientes atuais
        // 1. Manter a ordem salva, mas remover IDs que não deveriam mais estar aqui (ex: movidos para outro dia depois de salvar)
        const validSavedOrder = savedOrder.filter(id => currentDayClientIds.includes(id));
        
        // 2. Adicionar novos clientes que apareceram depois (ex: temporários adicionados agora)
        const newClients = currentDayClientIds.filter(id => !savedOrder.includes(id));
        
        setItems([...validSavedOrder, ...newClients]);
      } else {
        isFirstLoad.current = false;
        setItems(currentDayClientIds);
      }
    };

    if (!authLoading && clients.length > 0) {
      loadOrder();
    }
  }, [authLoading, clients, getClientsForDay, isClientMovedAway]);

  // Salvar ordem quando mudar
  useEffect(() => {
    const saveOrder = async () => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

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

    // Adicionar clientes temporários
    const temporaryClientsList: DailyClient[] = clients
      .filter(c => temporaryClients.has(c.id))
      .map(c => ({ ...c, isTemporary: true as const }));

    return [...originalClients, ...rescheduledClients, ...temporaryClientsList];
  })();

  // Função para adicionar cliente temporário ao roteiro
  const handleAddTemporaryClient = (clientId: string) => {
    setTemporaryClients(prev => new Set([...prev, clientId]));
    setItems(prev => [...prev, clientId]); // Adiciona ao final da lista ordenada
    setSearchQuery('');
    setShowSearchDialog(false);
    toast.success('Cliente adicionado ao roteiro temporário');
  };

  // Filtrar clientes disponíveis para busca (todos exceto os que já estão no roteiro)
  const availableClientsForSearch = clients.filter(client => {
    if (!client || !client.id) return false;
    const isInDailyRoute = allDailyClients.some(c => c && c.id === client.id);
    const isTemporary = temporaryClients.has(client.id);
    return !isInDailyRoute && !isTemporary;
  });

  // Filtrar clientes pela busca
  const filteredClients = searchQuery.trim()
    ? availableClientsForSearch.filter(client =>
        client && (
          (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (client.address && client.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (client.neighborhood && client.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

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

  const handleFinalize = async (clientId: string) => {
    console.log('🔥 Finalizando visita para cliente:', clientId);
    setLoadingClientId(clientId); // Mostrar loading
    try {
      // Adiciona visita simples sem dados detalhados
      await addDoc(collection(db, 'clients', clientId, 'visits'), {
        date: new Date(),
        timestamp: Timestamp.now(),
        registeredBy: auth.currentUser?.uid,
        type: 'quick-finalize'
      });

      // Adicionar cliente à lista de visitados
      setVisitedToday(prev => new Set(prev).add(clientId));
      lastLoadTimeRef.current = 0; // Invalida cache
      
      toast.success('Visita finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar visita:', error);
      toast.error('Erro ao finalizar visita');
    } finally {
      setLoadingClientId(null); // Remover loading
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
    .map(id => allDailyClients.find(c => c && c.id === id))
    .filter((c): c is DailyClient => !!c);

  const pendingClients = orderedClients.filter(c => c && !visitedToday.has(c.id));
  const completedClients = orderedClients.filter(c => c && visitedToday.has(c.id));

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
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Ocultar' : 'Expandir'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            {/* Botão Roteiro Temporário */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchDialog(true)}
                className="w-full flex items-center justify-center gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Plus className="h-4 w-4" />
                Adicionar Cliente Temporário
              </Button>
            </div>

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
                          onFinalize={() => handleFinalize(client.id)}
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
                      onFinalize={() => handleFinalize(client.id)}
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

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        clientId={selectedClientId}
        onSuccess={() => {
          // Adicionar cliente à lista de visitados quando finalizar com sucesso
          if (selectedClientId) {
            setVisitedToday(prev => new Set(prev).add(selectedClientId));
            lastLoadTimeRef.current = 0; // Invalida cache para próxima carga
          }
        }}
      />

      {/* Dialog de Busca de Clientes Temporários */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Cliente ao Roteiro Temporário</DialogTitle>
            <DialogDescription>
              Busque por um cliente para adicionar ao roteiro de hoje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Digite o nome do cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {searchQuery.trim() && (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleAddTemporaryClient(client.id)}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.address} • {client.neighborhood}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>
            )}

            {!searchQuery.trim() && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">
                Digite para buscar clientes
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
