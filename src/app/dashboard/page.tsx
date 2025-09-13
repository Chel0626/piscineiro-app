import { WeatherWidget } from '@/components/WeatherWidget'; // Importe o novo componente

export default function DashboardPage() {
  return (
    <div>
      {/* Adicione o WeatherWidget aqui */}
      <div className="mb-6">
        <WeatherWidget />
      </div>

      <h1 className="text-3xl font-bold tracking-tight">
        Bem-vindo ao seu Dashboard
      </h1>
      <p className="text-muted-foreground mt-2">
        Utilize a navegação ao lado para gerenciar seus clientes e roteiros.
      </p>
    </div>
  );
}