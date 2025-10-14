import { NextResponse, type NextRequest } from 'next/server';

export async function GET() {
  try {
    // Simulando dados de clima no formato esperado pelo WeatherWidget
    const currentTemp = Math.round(20 + Math.random() * 15); // 20-35°C
    const weatherCodes = [0, 1, 2, 3, 61, 80]; // Céu limpo, parcialmente nublado, nublado, chuva, etc.
    const currentWeatherCode = weatherCodes[Math.floor(Math.random() * weatherCodes.length)];
    
    // Gerar dados horários simulados
    const hourly = [];
    const currentHour = new Date().getHours();
    
    for (let i = 1; i <= 8; i++) {
      const hour = (currentHour + i) % 24;
      hourly.push({
        time: hour,
        temp: Math.round(currentTemp + (Math.random() - 0.5) * 6), // ±3°C variação
        weather_code: weatherCodes[Math.floor(Math.random() * weatherCodes.length)]
      });
    }

    const weatherData = {
      current: {
        temp: currentTemp,
        weather_code: currentWeatherCode
      },
      hourly: hourly,
      city: 'São Paulo, SP'
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Erro ao buscar clima:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados do clima.' }, { status: 500 });
  }
}