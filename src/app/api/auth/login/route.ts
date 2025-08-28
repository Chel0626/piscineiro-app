import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token não fornecido.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Define o cookie no cabeçalho da resposta
    response.cookies.set({
      name: 'firebase-auth-token',
      value: token,
      httpOnly: true, // O cookie não pode ser acessado via JavaScript no cliente
      secure: process.env.NODE_ENV === 'production', // Use 'secure' em produção (HTTPS)
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/', // O cookie está disponível em todas as rotas
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}