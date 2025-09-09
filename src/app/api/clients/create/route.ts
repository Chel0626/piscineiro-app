import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';

// Carrega as credenciais do ambiente
// Garanta que a variável FIREBASE_SERVICE_ACCOUNT_KEY exista no seu .env.local
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

// Inicializa o Firebase Admin (apenas se ainda não foi inicializado)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    // 1. PROCURAR O TOKEN NO CABEÇALHO DE AUTORIZAÇÃO
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado: Cabeçalho de autorização ausente ou mal formatado.' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado: Token não encontrado.' }, { status: 401 });
    }

    // 2. O resto da lógica continua a mesma
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Não autorizado: UID não encontrado no token.' }, { status: 401 });
    }

    const clientData = await request.json();

    const docRef = await db.collection('clients').add({
      ...clientData,
      userId: uid,
    });

    return NextResponse.json({ success: true, clientId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Erro na API /api/clients/create:', error);
    // Adiciona uma verificação para erros de token inválido
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Não autorizado: Token expirado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}