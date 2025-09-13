import { WeatherWidget } from '@/components/WeatherWidget';
import { Greeting } from '@/components/Greeting';
import { DailyRouteWidget } from '@/components/DailyRouteWidget';
import { PaymentsDueWidget } from '@/components/PaymentsDueWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <Greeting />
        <p className="text-muted-foreground">
          Aqui está um resumo do seu dia.
        </p>
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agora o Roteiro e os Vencimentos ficam lado a lado */}
        <DailyRouteWidget />
        <PaymentsDueWidget /> 
      </div>
    </div>
  );
}