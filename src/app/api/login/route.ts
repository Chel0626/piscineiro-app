// Força a rota a ser dinâmica (não fazer prerender durante build)
export const dynamic = 'force-dynamic';

// Endpoint espera receber { token } (ID token do Firebase) enviado pelo cliente.
// O cliente faz signIn client-side e envia o idToken para cá.
export async function POST(request: Request) {
  console.log('[api/login] Recebendo requisição POST');
  
  // Verifica se Firebase Admin está configurado
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return new Response(
      JSON.stringify({ error: 'Serviço temporariamente indisponível. Firebase Admin não configurado.' }), 
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Importação dinâmica apenas em runtime
  
  try {
    const { getAdminAuth } = await import('@/lib/firebase-admin');
    const adminAuth = getAdminAuth();
    
    const body = await request.json();
    console.log('[api/login] Body recebido:', JSON.stringify(body));
    const token = body?.token as string | undefined;

    if (!token) {
      console.warn('[api/login] Token ausente no body');
      return new Response(JSON.stringify({ error: 'Token é obrigatório.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('[api/login] Verificando ID token com Firebase Admin...');
    // Verifica o ID token com o Firebase Admin
    const decoded = await adminAuth.verifyIdToken(token);

    console.log('[api/login] Token válido para uid=', decoded.uid);
    return new Response(JSON.stringify({ success: true, user: { uid: decoded.uid, email: decoded.email ?? null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/login] Erro ao processar login:', err);
    
    // Retorna erro detalhado se for problema de inicialização do Firebase Admin
    if (err.message && (err.message.includes('Firebase Admin credentials') || err.message.includes('credential'))) {
       return new Response(JSON.stringify({ error: 'Erro de configuração do servidor: ' + err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Token inválido ou expirado.', details: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}