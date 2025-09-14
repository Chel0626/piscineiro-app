import { NextResponse } from 'next/server';

interface Verse {
  reference: string;
  text: string;
}

// Lista de versículos inspiradores para o dia (versão NAA - Nova Almeida Atualizada)
const dailyVerses: Verse[] = [
  {
    reference: "Salmos 118:24",
    text: "Este é o dia que o SENHOR fez; alegremo-nos e exultemos nele."
  },
  {
    reference: "Provérbios 3:5-6",
    text: "Confie no SENHOR de todo o coração e não se apoie no próprio entendimento; reconheça-o em todos os seus caminhos, e ele endireitará as suas veredas."
  },
  {
    reference: "Filipenses 4:13",
    text: "Tudo posso naquele que me fortalece."
  },
  {
    reference: "Jeremias 29:11",
    text: "Pois eu sei os planos que tenho para vocês — declara o SENHOR —, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro."
  },
  {
    reference: "Salmos 23:1",
    text: "O SENHOR é o meu pastor; nada me faltará."
  },
  {
    reference: "Isaías 40:31",
    text: "Mas aqueles que confiam no SENHOR renovam as suas forças, sobem com asas como águias, correm e não se cansam, caminham e não se fatigam."
  },
  {
    reference: "Mateus 6:26",
    text: "Vejam as aves do céu: elas não semeiam, não colhem, nem ajuntam em celeiros. Contudo, o Pai celestial as alimenta. Vocês não valem muito mais do que elas?"
  },
  {
    reference: "Josué 1:9",
    text: "Não lhe ordenei eu? Seja forte e corajoso! Não se apavore, nem se desanime, pois o SENHOR, seu Deus, estará com você por onde você andar."
  },
  {
    reference: "Salmos 46:1",
    text: "Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na tribulação."
  },
  {
    reference: "2 Coríntios 12:9",
    text: "Mas ele me disse: 'A minha graça basta para você, porque o meu poder se aperfeiçoa na fraqueza.'"
  },
  {
    reference: "Romanos 8:28",
    text: "Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito."
  },
  {
    reference: "Salmos 37:4",
    text: "Alegre-se no SENHOR, e ele satisfará os desejos do seu coração."
  },
  {
    reference: "1 Pedro 5:7",
    text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês."
  },
  {
    reference: "Provérbios 16:3",
    text: "Confie ao SENHOR as suas obras, e os seus planos serão estabelecidos."
  },
  {
    reference: "Mateus 11:28",
    text: "Venham a mim, todos vocês que estão cansados e sobrecarregados, e eu lhes darei descanso."
  }
];

export async function GET() {
  try {
    // Usar a data atual para sempre ter o mesmo versículo no mesmo dia
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Selecionar versículo baseado no dia do ano para garantir consistência
    const verseIndex = dayOfYear % dailyVerses.length;
    const todaysVerse = dailyVerses[verseIndex];

    return NextResponse.json({
      success: true,
      verse: todaysVerse
    });

  } catch (error) {
    console.error('Erro ao buscar versículo:', error);
    
    // Versículo padrão em caso de erro
    return NextResponse.json({
      success: true,
      verse: {
        reference: "Salmos 118:24",
        text: "Este é o dia que o SENHOR fez; alegremo-nos e exultemos nele."
      }
    });
  }
}