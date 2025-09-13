// src/app/api/weather/route.ts

import { NextResponse } from 'next/server';

// Coordenadas para Indaiatuba
const lat = -23.08;
const lon = -47.21;

export async function GET() {
  try {
    // URL da API Open-Meteo para buscar tempo atual e previsão horária
    const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=America/Sao_Paulo`;

    const response = await fetch(weatherApiUrl, {
      next: {
        revalidate: 1800, // Armazena em cache por 30 minutos
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro da API Open-Meteo:", errorData);
      return NextResponse.json({ error: 'Falha ao buscar dados do clima.' }, { status: response.status });
    }

    const data = await response.json();

    // A Open-Meteo retorna os dados de forma um pouco diferente, então processamos aqui
    const now = new Date();
    const currentHour = now.getHours();
    
    // Encontra o índice da hora atual na lista de previsões
    const currentIndex = data.hourly.time.findIndex((isoString: string) => new Date(isoString).getHours() === currentHour);

    const processedData = {
      current: {
        temp: Math.round(data.current.temperature_2m),
        weather_code: data.current.weather_code,
      },
      // Pegamos as próximas 8 horas a partir da hora atual
      hourly: data.hourly.time.slice(currentIndex, currentIndex + 8).map((isoString: string, index: number) => ({
        time: new Date(isoString).getHours(),
        temp: Math.round(data.hourly.temperature_2m[currentIndex + index]),
        weather_code: data.hourly.weather_code[currentIndex + index],
      })),
      city: "Indaiatuba", // Open-Meteo não retorna o nome da cidade, então definimos manualmente
    };

    return NextResponse.json(processedData);

  } catch (error) {
    console.error('Erro na API /api/weather:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}