import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Piscineiro App
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          A solução completa para o gerenciamento do seu trabalho.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/login">Fazer Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Cadastre-se</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}