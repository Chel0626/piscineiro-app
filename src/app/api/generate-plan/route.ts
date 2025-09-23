import { NextResponse, type NextRequest } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// Pega a chave da API das variáveis de ambiente (seguro no servidor)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Agora recebemos a imagem como texto (base64)
    const { imageBase64, mimeType, poolVolume, ph, cloro, alcalinidade, description } = body;

    // Verificar se temos pelo menos uma imagem OU uma descrição
    if ((!imageBase64 && !description) || (poolVolume == null && ph == null && cloro == null && alcalinidade == null)) {
      return NextResponse.json({ error: 'Dados incompletos: forneça pelo menos uma foto ou descrição, e algum parâmetro da água.' }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ]
    });

    const prompt = `
      Você é um especialista em tratamento de piscinas com 20 anos de experiência
      e segue as normas técnicas da ANAPP. Sua tarefa é criar um plano de ação
      profissional seguindo EXATAMENTE a estrutura especificada.

      DADOS DA PISCINA:
      ${poolVolume ? `- Volume: ${poolVolume} mil litros` : '- Volume: Não informado'}
      ${ph != null ? `- pH: ${ph}` : '- pH: Não medido'}
      ${cloro != null ? `- Cloro Livre: ${cloro} ppm` : '- Cloro Livre: Não medido'}
      ${alcalinidade != null ? `- Alcalinidade Total: ${alcalinidade} ppm` : '- Alcalinidade Total: Não medida'}
      ${description ? `\nDescrição visual: ${description}` : ''}
      ${imageBase64 ? '\n(Análise da imagem também será considerada)' : ''}

      RESPONDA SEGUINDO EXATAMENTE ESTA ESTRUTURA:

      ## **Plano de Ação**

      ### **Etapa 1: Diagnóstico**
      - Analise os parâmetros que estão muito fora e precisam ser corrigidos
      - Se cabível, faça o cruzamento dos dados e analise o porquê da piscina ficar naquele estado
      - Não precisa de um diagnóstico fora de série, seja objetivo

      ### **Etapa 2: Método de Recuperação**
      **A IA deve avaliar e escolher UM dos caminhos abaixo:**

      #### **Opção A - Decantação:**
      - **Pergunta importante:** Sulfato de alumínio ou floculante?
      - **Recomendação específica:** [Escolher e justificar]
      - **Cálculo de dosagem:** [Quantidade exata do produto escolhido]
      - **Observação:** Sulfato = filtro no recircular / Clarificante = filtrar normal

      #### **Opção B - Recuperação com Filtração:**
      - **Método 1 - Peróxido:** Resolver os parâmetros e deixar filtrar o máximo possível (pelo menos 12h)
      - **Método 2 - Clear Gel:** Dosagem oxidante de cloro ou peróxido + correção de alcalinidade + filtragem por 12h seguidas

      ### **Etapa 3: Finalização**
      **Se escolheu Decantação (Opção A):**
      - Aspiração completa do sedimento
      - Conferir parâmetros após aspiração
      - Corrigir se necessário

      **Se escolheu Recuperação com Filtração (Opção B):**
      - Lavar a areia do filtro
      - Conferir parâmetros após lavagem
      - Corrigir se necessário

      **IMPORTANTE:** Siga rigorosamente esta estrutura. Seja direto e objetivo.
    `;

    // Criar o conteúdo baseado no que temos disponível
    const content: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    if (imageBase64 && mimeType) {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      };
      content.push(imagePart);
    }

    const result = await model.generateContent(content);
    const responseText = result.response.text();
    
    return NextResponse.json({ plan: responseText });

  } catch (error) {
    console.error('Erro na API /api/generate-plan:', error);
    return NextResponse.json({ error: 'Falha ao se comunicar com o serviço de IA.' }, { status: 500 });
  }
}