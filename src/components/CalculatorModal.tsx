import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  poolVolume: number;
  clientName: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ open, onClose, poolVolume, clientName }) => {
  const [ph, setPh] = useState(7.2);
  const [cloro, setCloro] = useState(1.0);
  const [alcalinidade, setAlcalinidade] = useState(80);
  const [result, setResult] = useState<string[]>([]);

  function calcularDosagem() {
    // Exemplo de cálculo simples
    const tasks: string[] = [];
    if (ph < 7.4) {
      tasks.push(`Aplicar ${(poolVolume * 6).toFixed(0)}g de Barrilha Leve.`);
    }
    if (cloro < 1.5) {
      tasks.push(`Aplicar ${(poolVolume * 2).toFixed(0)}g de Cloro Granulado.`);
    }
    if (alcalinidade < 100) {
      tasks.push(`Aplicar ${(poolVolume * 1).toFixed(0)}g de Elevador de Alcalinidade.`);
    }
    setResult(tasks);
  }

  function copiarWhatsapp() {
    const msg = result.map(r => `- ${r}`).join('\n');
    navigator.clipboard.writeText(msg);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-4 max-w-md mx-auto bg-white rounded shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-bold text-lg">Calculadora - Cliente {clientName}</span>
          <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Volume: {poolVolume}m³</span>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div>
            <label className="text-sm font-medium">pH Atual</label>
            <Input type="number" step="0.1" value={ph} onChange={e => setPh(Number(e.target.value))} className="text-lg" />
          </div>
          <div>
            <label className="text-sm font-medium">Cloro (ppm)</label>
            <Input type="number" step="0.1" value={cloro} onChange={e => setCloro(Number(e.target.value))} className="text-lg" />
          </div>
          <div>
            <label className="text-sm font-medium">Alcalinidade (ppm)</label>
            <Input type="number" step="1" value={alcalinidade} onChange={e => setAlcalinidade(Number(e.target.value))} className="text-lg" />
          </div>
        </div>
        <Button className="w-full mb-3" onClick={calcularDosagem}>Calcular Dosagem</Button>
        {result.length > 0 && (
          <div className="bg-gray-50 rounded p-3 mb-2">
            <div className="font-semibold mb-2">Tarefas:</div>
            <ul className="space-y-2">
              {result.map((r, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-blue-500" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" className="mt-2" onClick={copiarWhatsapp}>Copiar para WhatsApp</Button>
          </div>
        )}
        <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Fechar</Button>
      </div>
    </Dialog>
  );
};
