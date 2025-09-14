import { WeatherWidget } from '@/components/WeatherWidget';
import { TimeBasedWidget } from '@/components/TimeBasedWidget';
import { DailyRouteWidget } from '@/components/DailyRouteWidget';
import { PaymentsDueWidget } from '@/components/PaymentsDueWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TimeBasedWidget />

      <WeatherWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agora o Roteiro e os Vencimentos ficam lado a lado */}
        <DailyRouteWidget />
        <PaymentsDueWidget /> 
      </div>
    </div>
  );
}