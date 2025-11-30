import React, { useState, useEffect } from 'react';

interface SortableClientItemProps {
  client: RouteClient;
  state: RouteClientState;
  timer: number;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onOpenTools: () => void;
}

const SortableClientItem: React.FC<SortableClientItemProps> = ({ client, state, timer, onCheckIn, onCheckOut, onOpenTools }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      className={`rounded-lg p-4 shadow-md transition-all flex items-center ${
        state === 'pending'
          ? 'bg-white border'
          : state === 'inProgress'
          ? 'border-blue-500 bg-blue-50 animate-pulse'
          : 'bg-gray-100 opacity-60 border-green-500'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mr-3 p-2 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 cursor-grab"
        title="Arraste para reordenar"
        style={{ touchAction: 'none' }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M7 10v4m5-4v4m5-4v4"/></svg>
      </button>
      <div className="flex-1">
        <div className="font-bold text-lg">{client.name}</div>
        <div className="text-sm text-gray-600">{client.address} - {client.neighborhood}</div>
      </div>
      <div className="flex gap-2 items-center">
        {state === 'pending' && (
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={onCheckIn}
          >Iniciar Visita</button>
        )}
        {state === 'inProgress' && (
          <>
            <span className="font-mono text-blue-700">{timer ? `${timer} min` : '00:00 min'}</span>
            <button
              className="bg-gray-200 px-2 py-1 rounded"
              onClick={onOpenTools}
            >Ferramentas</button>
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={onCheckOut}
            >Finalizar Visita</button>
          </>
        )}
        {state === 'done' && (
          <span className="text-green-600 font-bold flex items-center gap-1">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            Concluído
          </span>
        )}
      </div>
    </div>
  );
};
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type RouteClientState = 'pending' | 'inProgress' | 'done';

export interface RouteClient {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  state: RouteClientState;
  checkInTime?: string;
  checkOutTime?: string;
  durationMinutes?: number;
}

interface RouteListProps {
  clients: RouteClient[];
  onCheckIn: (clientId: string, checkInTime: string) => void;
  onCheckOut: (clientId: string, checkOutTime: string) => void;
  onOpenTools: (clientId: string) => void;
}

export const RouteList: React.FC<RouteListProps> = ({ clients, onCheckIn, onCheckOut, onOpenTools }) => {
  const [clientStates, setClientStates] = useState<{ [id: string]: RouteClientState }>(() => {
    const initial: { [id: string]: RouteClientState } = {};
    clients.forEach((c: RouteClient) => { initial[c.id] = c.state; });
    return initial;
  });
  const [checkInTimes, setCheckInTimes] = useState<{ [id: string]: string }>({});
  const [timers, setTimers] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(clientStates).forEach(id => {
          if (clientStates[id] === 'inProgress' && checkInTimes[id]) {
            const diff = Math.round((Date.now() - new Date(checkInTimes[id]).getTime()) / 60000);
            updated[id] = diff;
          }
        });
        return updated;
      });
    }, 1000 * 30);
    return () => clearInterval(interval);
  }, [clientStates, checkInTimes]);

  const handleCheckInLocal = (clientId: string) => {
    const now = new Date().toISOString();
    setClientStates(prev => ({ ...prev, [clientId]: 'inProgress' }));
    setCheckInTimes(prev => ({ ...prev, [clientId]: now }));
    onCheckIn(clientId, now);
  };

  const handleCheckOutLocal = (clientId: string) => {
    const now = new Date().toISOString();
    setClientStates(prev => ({ ...prev, [clientId]: 'done' }));
    onCheckOut(clientId, now);
  };

  return (
    <div className="space-y-4">
      {clients.map(client => (
        <SortableClientItem
          key={client.id}
          client={client}
          state={clientStates[client.id]}
          timer={timers[client.id]}
          onCheckIn={() => handleCheckInLocal(client.id)}
          onCheckOut={() => handleCheckOutLocal(client.id)}
          onOpenTools={() => onOpenTools(client.id)}
        />
      ))}
    </div>
  );
};
