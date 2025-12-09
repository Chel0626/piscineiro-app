import { NextRequest, NextResponse } from 'next/server';

// Força a rota a ser dinâmica (não fazer prerender durante build)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Variáveis de ambiente do Firebase Admin não configuradas');
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
    }

    // Importar Firebase Admin dinamicamente para evitar problemas de inicialização
    const { getAdminAuth, getAdminStorage } = await import('@/lib/firebase-admin');
    const auth = getAdminAuth();
    const storage = getAdminStorage();
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Arquivo e clientId são obrigatórios' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `diagnostics/${clientId}/${decodedToken.uid}/${new Date().toISOString()}_${file.name}`;
    
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Torna o arquivo publicamente acessível
    await fileRef.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error('Erro detalhado no upload:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}