import { NextResponse, type NextRequest } from 'next/server';

// Força a rota a ser dinâmica (não fazer prerender durante build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Verifica se Firebase Admin está configurado
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.json(
      { error: 'Serviço temporariamente indisponível. Firebase Admin não configurado.' }, 
      { status: 503 }
    );
  }

  // Importação dinâmica apenas em runtime
  const { getAdminAuth } = await import('@/lib/firebase-admin');
  const auth = getAdminAuth();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();

  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado: Cabeçalho de autorização ausente ou mal formatado.' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado: Token não encontrado.' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Não autorizado: UID não encontrado no token.' }, { status: 401 });
    }

    // Verificar limites do plano
    const isSuperAdmin = uid === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    
    if (!isSuperAdmin) {
      const subDoc = await db.collection('subscriptions').doc(uid).get();
      const subData = subDoc.data();
      
      // Se não tiver assinatura ativa, bloqueia (embora o front já bloqueie, é bom garantir)
      if (!subData || subData.status !== 'authorized') {
         return NextResponse.json({ error: 'Assinatura inativa.' }, { status: 403 });
      }

      // Se for plano gratuito, verificar limite de 3 clientes
      if (subData.planId === 'free') {
        const clientsSnapshot = await db.collection('clients').where('userId', '==', uid).count().get();
        const clientCount = clientsSnapshot.data().count;
        
        if (clientCount >= 3) {
          return NextResponse.json({ 
            error: 'Limite de clientes atingido no plano Gratuito. Faça upgrade para adicionar mais clientes.' 
          }, { status: 403 });
        }
      }
    }

    const clientData = await request.json();

    const docRef = await db.collection('clients').add({ ...clientData, userId: uid });

    return NextResponse.json({ success: true, clientId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Erro na API /api/clients/create:', error);
    
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Não autorizado: Token expirado.' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}