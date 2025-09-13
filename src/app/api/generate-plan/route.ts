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
    const { imageBase64, mimeType, poolVolume, ph, cloro, alcalinidade } = body;

    if (!imageBase64 || !mimeType || !poolVolume || ph == null || cloro == null || alcalinidade == null) {
      return NextResponse.json({ error: 'Dados incompletos foram enviados.' }, { status: 400 });
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

    // A imagem já vem pronta para uso
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const prompt = `
      Você é um especialista em tratamento de piscinas com 20 anos de experiência
      e segue as normas técnicas da ANAPP. Sua tarefa é criar um plano de ação
      profissional, claro e detalhado.

      Analise a imagem da piscina fornecida e os seguintes parâmetros de uma
      piscina de ${poolVolume} mil litros:
      - pH: ${ph}
      - Cloro Livre: ${cloro} ppm
      - Alcalinidade Total: ${alcalinidade} ppm

      Com base na análise visual e nos parâmetros, forneça:
      1.  Um diagnóstico claro da situação atual da água.
      2.  Um plano de ação passo a passo.
      3.  Cálculos de dosagens exatas dos produtos, se necessário.
      4.  Apresente a resposta em formato Markdown.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    return NextResponse.json({ plan: responseText });

  } catch (error) {
    console.error('Erro na API /api/generate-plan:', error);
    return NextResponse.json({ error: 'Falha ao se comunicar com o serviço de IA.' }, { status: 500 });
  }
}