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
  // Removido todas as funções e JSX de cenas/gifs. Renderização final apenas do card de saudação e versículo.
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {getTimeOfDay() === 'morning' && 'Bom dia!'}
            {getTimeOfDay() === 'afternoon' && 'Boa tarde!'}
            {getTimeOfDay() === 'night' && 'Boa noite!'}
          </span>
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        {verse && (
          <div className="mt-2 text-base text-gray-700">
            <span className="font-semibold">{verse.reference}</span>: {verse.text}
          </div>
        )}
      </div>
    </div>
  );
}