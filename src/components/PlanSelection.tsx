'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSuperAdmin } from '@/lib/userRoles';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  mercadoPagoInitPoint?: string;
  order: number;
}

export function PlanSelection() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, 'subscription_plans');
        const q = query(plansRef, where('active', '==', true), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Plan[];
        
        setPlans(plansData);
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.price === 0) {
      // Lógica para plano gratuito
      console.log('Assinar plano gratuito:', plan.name);
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        console.error('Erro ao criar checkout:', data.error);
        alert('Erro ao iniciar pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setProcessingPlanId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Escolha o plano ideal para você
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comece a profissionalizar sua gestão de piscinas hoje mesmo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col relative ${
              plan.id === 'pro_yearly' 
                ? 'border-blue-500 shadow-xl scale-105 z-10' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            {plan.id === 'pro_yearly' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Melhor Custo-Benefício
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500 ml-2">
                    /{plan.interval === 'month' ? 'mês' : 'ano'}
                  </span>
                )}
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                className={`w-full ${
                  plan.id === 'pro_yearly' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
                variant={plan.id === 'pro_yearly' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan)}
                disabled={processingPlanId === plan.id}
              >
                {processingPlanId === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Pagamento seguro via Mercado Pago. Cancele quando quiser.</p>
      </div>
    </div>
  );
}

