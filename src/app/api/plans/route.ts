import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plansRef = db.collection('subscription_plans');
    const snapshot = await plansRef.where('active', '==', true).orderBy('order', 'asc').get();
    
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro ao buscar planos' }, { status: 500 });
  }
}
