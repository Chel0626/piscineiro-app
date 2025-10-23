import { auth as adminAuth } from '@/lib/firebase-admin';

// Endpoint espera receber { token } (ID token do Firebase) enviado pelo cliente.
// O cliente faz signIn client-side e envia o idToken para cá.
export async function POST(request: Request) {
  console.log('[api/login] Recebendo requisição POST');
  try {
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
  } catch (err) {
    console.error('[api/login] Erro ao verificar token:', err);
    return new Response(JSON.stringify({ error: 'Token inválido ou expirado.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}