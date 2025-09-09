import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Remove o cookie
    response.cookies.set({
      name: 'firebase-auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: -1,
      path: '/',
    });

    return response;
  } catch (error) {
    // Apenas logamos o erro no servidor, sem a variável 'error' não usada
    console.error('Erro na API de logout:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}