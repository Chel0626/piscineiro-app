'use client';

import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

  return (
    <Card className="w-full max-w-xl mx-auto overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <CardContent className="p-6 relative">
        <Quote className="absolute top-4 right-4 w-16 h-16 text-white/10 rotate-180" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {timeOfDay === 'morning' && 'Bom dia!'}
            {timeOfDay === 'afternoon' && 'Boa tarde!'}
            {timeOfDay === 'night' && 'Boa noite!'}
          </h2>
          
          {verse ? (
            <div className="space-y-3">
              <p className="text-lg font-medium leading-relaxed italic opacity-95">
                "{verse.text}"
              </p>
              <p className="text-sm font-semibold text-white/80 text-right uppercase tracking-wide">
                — {verse.reference}
              </p>
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}