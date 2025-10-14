import { NextResponse, type NextRequest } from 'next/server';

const verses = [
  "A disciplina é o combustível da conquista.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Você não pode controlar o vento, mas pode ajustar as velas.",
  "A persistência é o caminho do êxito.",
  "Grandes realizações exigem grandes ambições.",
  "O primeiro passo para o sucesso é acreditar que você pode conseguir.",
  "A diferença entre o impossível e o possível está na determinação.",
  "Cada dia é uma nova oportunidade de crescer.",
];

export async function GET() {
  try {
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    return NextResponse.json({ verse: randomVerse });
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    return NextResponse.json({ error: 'Erro ao carregar verso.' }, { status: 500 });
  }
}