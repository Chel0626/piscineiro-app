import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado: Cabeçalho de autorização ausente ou mal formatado.' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado: Token não encontrado.' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Não autorizado: UID não encontrado no token.' }, { status: 401 });
    }

    const clientData = await request.json();
    const docRef = await db.collection('clients').add({ ...clientData, userId: uid });

    return NextResponse.json({ success: true, clientId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Erro na API /api/clients/create:', error);
    if (error instanceof Error && 'code' in error) { // Corrigido
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Não autorizado: Token expirado.' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}