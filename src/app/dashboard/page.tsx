// src/app/dashboard/page.tsx
import { WeatherWidget } from '@/components/WeatherWidget';
import { Greeting } from '@/components/Greeting';
import { DailyRouteWidget } from '@/components/DailyRouteWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Greeting />
            <p className="text-muted-foreground">
                Aqui está um resumo do seu dia.
            </p>
        </div>
        <div className="lg:col-span-1">
            <WeatherWidget />
        </div>
      </div>

      <div>
        <DailyRouteWidget />
      </div>

      {/* Manteremos este espaço para o futuro widget de vencimentos */}
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Vencimentos do Dia</h2>
        <p>Em breve...</p>
      </div> 
      */}
    </div>
  );
}