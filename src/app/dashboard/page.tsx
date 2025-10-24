import { WeatherWidget } from '@/components/WeatherWidget';
import { DailyRouteWidget } from '@/components/DailyRouteWidget';
import { PaymentsDueWidget } from '@/components/PaymentsDueWidget';
import { OverduePaymentsWidget } from '@/components/OverduePaymentsWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WeatherWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roteiro e Vencimentos de Hoje */}
        <DailyRouteWidget />
        <PaymentsDueWidget />
      </div>

      {/* Widget de Pagamentos Vencidos - pode ocupar largura total se necessário */}
      <OverduePaymentsWidget />
    </div>
  );
}