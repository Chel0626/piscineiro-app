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
      profissional, claro e detalhado.

      ${poolVolume ? `Piscina de ${poolVolume} mil litros` : 'Piscina'}:
      ${ph != null ? `- pH: ${ph}` : ''}
      ${cloro != null ? `- Cloro Livre: ${cloro} ppm` : ''}
      ${alcalinidade != null ? `- Alcalinidade Total: ${alcalinidade} ppm` : ''}
      
      ${description ? `Descrição das condições: ${description}` : ''}
      ${imageBase64 ? 'Analise também a imagem da piscina fornecida.' : ''}

      Com base ${imageBase64 ? 'na análise visual e ' : ''}nos parâmetros${description ? ' e descrição' : ''}, forneça:
      1.  Um diagnóstico claro da situação atual da água.
      2.  Um plano de ação passo a passo.
      3.  Cálculos de dosagens exatas dos produtos, se necessário.
      4.  Apresente a resposta em formato Markdown.
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