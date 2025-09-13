'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudSun, Zap, CloudFog } from 'lucide-react';

// Tipos para os novos dados da Open-Meteo
interface WeatherData {
  current: {
    temp: number;
    weather_code: number;
  };
  hourly: {
    time: number;
    temp: number;
    weather_code: number;
  }[];
  city: string;
}

// Mapeia os códigos de clima da Open-Meteo para ícones e descrições
const getWeatherInfo = (code: number): { description: string; Icon: React.ElementType } => {
  if (code === 0) return { description: 'Céu limpo', Icon: Sun };
  if (code === 1) return { description: 'Quase limpo', Icon: Sun };
  if (code === 2) return { description: 'Parcialmente nublado', Icon: CloudSun };
  if (code === 3) return { description: 'Nublado', Icon: Cloud };
  if (code >= 45 && code <= 48) return { description: 'Nevoeiro', Icon: CloudFog };
  if (code >= 51 && code <= 57) return { description: 'Chuvisco', Icon: CloudRain };
  if (code >= 61 && code <= 67) return { description: 'Chuva', Icon: CloudRain };
  if (code >= 71 && code <= 77) return { description: 'Neve', Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { description: 'Pancadas de chuva', Icon: CloudRain };
  if (code >= 95 && code <= 99) return { description: 'Trovoada', Icon: Zap };
  return { description: 'Desconhecido', Icon: Sun }; // Padrão
};

const WeatherIcon = ({ code }: { code: number }) => {
  const { Icon } = getWeatherInfo(code);
  return <Icon className="h-8 w-8 text-yellow-400" />;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Não foi possível carregar a previsão do tempo.');
        }
        return res.json();
      })
      .then((data) => setWeather(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card className="bg-red-100 border-red-400 text-red-700">
        <CardHeader><CardTitle>Erro na Previsão do Tempo</CardTitle></CardHeader>
        <CardContent><p>{error}</p></CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card>
        <CardHeader><CardTitle>Previsão do Tempo</CardTitle></CardHeader>
        <CardContent><p>Carregando...</p></CardContent>
      </Card>
    );
  }

  const { description } = getWeatherInfo(weather.current.weather_code);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão para {weather.city}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <WeatherIcon code={weather.current.weather_code} />
          <div>
            <p className="text-4xl font-bold">{weather.current.temp}°C</p>
            <p className="text-muted-foreground capitalize">{description}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Próximas horas:</h4>
          <div className="flex justify-between gap-2 overflow-x-auto">
            {weather.hourly.map((hour, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-gray-100 min-w-[60px]">
                <span className="text-sm font-medium">{hour.time}h</span>
                <WeatherIcon code={hour.weather_code} />
                <span className="font-bold">{hour.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}