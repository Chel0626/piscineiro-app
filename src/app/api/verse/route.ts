import { NextResponse, type NextRequest } from 'next/server';

const verses = [
  {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13"
  },
  {
    text: "O Senhor é o meu pastor, nada me faltará.",
    reference: "Salmos 23:1"
  },
  {
    text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
    reference: "Provérbios 3:5"
  },
  {
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
    reference: "João 3:16"
  },
  {
    text: "Entregue o seu caminho ao Senhor; confie nele, e ele agirá.",
    reference: "Salmos 37:5"
  },
  {
    text: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!",
    reference: "Filipenses 4:4"
  },
  {
    text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.",
    reference: "Isaías 41:10"
  },
  {
    text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar.",
    reference: "Jeremias 29:11"
  },
  {
    text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês.",
    reference: "Mateus 6:33"
  },
  {
    text: "O Senhor é a minha luz e a minha salvação; de quem terei temor?",
    reference: "Salmos 27:1"
  }
];

export async function GET() {
  try {
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    return NextResponse.json({ 
      success: true,
      verse: randomVerse 
    });
  } catch (error) {
    console.error('Erro ao buscar verso:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao carregar verso.' 
    }, { status: 500 });
  }
}