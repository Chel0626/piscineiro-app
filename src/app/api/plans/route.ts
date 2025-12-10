import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const plansRef = db.collection('subscription_plans');
    // Removemos o orderBy da query para evitar a necessidade de criar um índice composto no Firestore
    // Como são poucos planos, podemos ordenar em memória sem impacto na performance
    const snapshot = await plansRef.where('active', '==', true).get();
    
    const plans = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
