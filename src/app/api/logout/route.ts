import { NextResponse, type NextRequest } from 'next/server';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    await signOut(auth);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ error: 'Erro ao fazer logout.' }, { status: 500 });
  }
}