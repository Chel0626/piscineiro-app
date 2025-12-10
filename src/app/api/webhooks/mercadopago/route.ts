import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { db } from '@/lib/firebase-admin';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    console.log(`Webhook received: topic=${topic}, id=${id}`);

    // O Mercado Pago pode enviar notificações de várias formas.
    // Vamos focar em 'subscription_preapproval' (assinaturas)
    // Às vezes vem no body também.
    
    let notificationId = id;
    let notificationType = topic;

    if (!notificationId) {
        const body = await request.json();
        console.log('Webhook body:', body);
        notificationId = body?.data?.id || body?.id;
        notificationType = body?.type || body?.topic;
    }

    if (notificationType === 'subscription_preapproval' || notificationType === 'preapproval') {
      if (!notificationId) {
          return NextResponse.json({ error: 'No ID found' }, { status: 400 });
      }

      const preApproval = new PreApproval(client);
      const subscription = await preApproval.get({ id: notificationId });

      console.log('Subscription details:', {
        id: subscription.id,
        status: subscription.status,
        external_reference: subscription.external_reference,
        payer_email: subscription.payer_email
      });

      const uid = subscription.external_reference;
      const status = subscription.status; // authorized, paused, cancelled, pending

      if (uid) {
        // Atualizar Firestore
        // @ts-ignore - preapproval_plan_id existe na resposta mas não na tipagem oficial
        const planId = subscription.preapproval_plan_id || 'unknown';
        
        await db.collection('subscriptions').doc(uid).set({
          status: status, // 'authorized' é o status ativo
          mercadoPagoSubscriptionId: subscription.id,
          planId: planId, // ID do plano no MP
          payerEmail: subscription.payer_email,
          updatedAt: new Date(),
          lastEvent: notificationType
        }, { merge: true });



        console.log(`Subscription updated for user ${uid}: ${status}`);
      } else {
          console.warn('No external_reference (UID) found in subscription');
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    // Retornar 200 mesmo com erro para o MP não ficar tentando reenviar infinitamente se for erro de lógica nossa
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}
