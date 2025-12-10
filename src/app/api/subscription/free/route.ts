import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Verificar se já existe assinatura ativa (para não sobrescrever um plano pago)
    const subRef = db.collection('subscriptions').doc(uid);
    const subSnap = await subRef.get();

    if (subSnap.exists) {
      const subData = subSnap.data();
      if (subData?.status === 'authorized' && subData?.planId !== 'free') {
        return NextResponse.json({ error: 'User already has an active paid subscription' }, { status: 400 });
      }
    }

    // Ativar plano gratuito
    await subRef.set({
      status: 'authorized', // Status ativo
      planId: 'free',
      payerEmail: email,
      updatedAt: new Date(),
      lastEvent: 'free_plan_activation'
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Free plan activation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
