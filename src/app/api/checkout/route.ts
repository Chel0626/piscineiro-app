import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });

export async function POST(request: Request) {
  try {
    // Autenticação via cookie (já que é uma chamada do front para o back no mesmo domínio)
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;


    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar token e pegar UID
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Buscar detalhes do plano no Firestore
    const planDoc = await db.collection('subscription_plans').doc(planId).get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();
    const mpPlanId = planData?.mercadoPagoPlanId;

    if (!mpPlanId) {
      return NextResponse.json({ error: 'Mercado Pago Plan ID not configured' }, { status: 500 });
    }

    // Criar assinatura específica para o usuário
    const preApproval = new PreApproval(client);
    
    const response = await preApproval.create({
      body: {
        preapproval_plan_id: mpPlanId,
        payer_email: email,
        external_reference: uid, // VINCULA O USUÁRIO À ASSINATURA
        back_url: 'https://piscineiro-app.vercel.app/dashboard', // Retorno após pagamento
        status: 'pending',
      }
    });

    return NextResponse.json({ initPoint: response.init_point });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
