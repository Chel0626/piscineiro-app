import { NextResponse, type NextRequest } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    return NextResponse.json({ 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email
      }
    });

  } catch (error) {
    let message = 'Erro interno do servidor.';
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (code === 'auth/wrong-password') {
        message = 'Senha incorreta.';
      } else if (code === 'auth/invalid-email') {
        message = 'Email inválido.';
      }
    }
    console.error('Erro no login:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}