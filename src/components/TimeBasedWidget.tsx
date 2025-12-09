'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';

type TimeOfDay = 'morning' | 'afternoon' | 'night';

interface VerseData {
  reference: string;
  text: string;
}

const getTimeOfDay = (): TimeOfDay => {
  const currentHour = new Date().getHours();
  
  // Bom dia: 6h às 11h59
  if (currentHour >= 6 && currentHour < 12) {
    return 'morning';
  }
  // Boa tarde: 12h às 17h59  
  if (currentHour >= 12 && currentHour < 18) {
    return 'afternoon';
  }
  // Boa noite: 18h às 5h59 (incluindo madrugada)
  return 'night';
};

export function TimeBasedWidget() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [verse, setVerse] = useState<VerseData | null>(null);

  useEffect(() => {
    // Define a saudação correta após a montagem para evitar erro de hidratação
    setTimeOfDay(getTimeOfDay());

    // Busca o versículo do dia
    const fetchVerse = async () => {
      try {
        const response = await fetch('/api/verse');
        const data = await response.json();
        if (data.success && data.verse) {
          setVerse(data.verse);
        }
      } catch (error) {
        console.error('Erro ao buscar versículo:', error);
      }
    };

    fetchVerse();
  }, []);

  // Removido todas as funções e JSX de cenas/gifs. Renderização final apenas do card de saudação e versículo.
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {timeOfDay === 'morning' && 'Bom dia!'}
            {timeOfDay === 'afternoon' && 'Boa tarde!'}
            {timeOfDay === 'night' && 'Boa noite!'}
          </span>
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        {verse ? (
          <div className="mt-2 text-base text-gray-700">
            <span className="font-semibold">{verse.reference}</span>: {verse.text}
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-400 animate-pulse">
            Carregando versículo...
          </div>
        )}
      </div>
    </div>
  );
}