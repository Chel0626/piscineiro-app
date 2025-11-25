import React, { useState, useEffect } from 'react';

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
        <div
          key={client.id}
          className={`rounded-lg p-4 shadow-md transition-all ${
            clientStates[client.id] === 'pending'
              ? 'bg-white border'
              : clientStates[client.id] === 'inProgress'
              ? 'border-blue-500 bg-blue-50 animate-pulse'
              : 'bg-gray-100 opacity-60 border-green-500'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{client.name}</div>
              <div className="text-sm text-gray-600">{client.address} - {client.neighborhood}</div>
            </div>
            <div className="flex gap-2 items-center">
              {clientStates[client.id] === 'pending' && (
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                  onClick={() => handleCheckInLocal(client.id)}
                >Iniciar Visita</button>
              )}
              {clientStates[client.id] === 'inProgress' && (
                <>
                  <span className="font-mono text-blue-700">{timers[client.id] ? `${timers[client.id]} min` : '00:00 min'}</span>
                  <button
                    className="bg-gray-200 px-2 py-1 rounded"
                    onClick={() => onOpenTools(client.id)}
                  >Ferramentas</button>
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded"
                    onClick={() => handleCheckOutLocal(client.id)}
                  >Finalizar Visita</button>
                </>
              )}
              {clientStates[client.id] === 'done' && (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  Concluído
                </span>
              )}
              <a
                href={`https://waze.com/ul?ll=${encodeURIComponent(client.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-400 hover:text-blue-600"
                title="Navegar"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
