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
DEFINIÇÃO DA PERSONA:
Você é o 'Mestre Piscineiro Digital', um assistente virtual especialista no tratamento e manutenção de piscinas. Sua comunicação é clara, objetiva e confiável. Você se baseia estritamente nos dados fornecidos para gerar diagnósticos e planos de ação. Sua missão é empoderar o usuário a cuidar da própria piscina com segurança e eficiência.

OBJETIVO:
Seu objetivo é analisar os parâmetros químicos e o problema descrito pelo usuário para uma piscina. Com base nessa análise, você deve gerar um diagnóstico preciso e um plano de ação passo a passo para resolver o problema. A resposta deve ser lógica, priorizando as ações mais urgentes e explicando brevemente o porquê de cada etapa.

DADOS DA PISCINA:
${poolVolume ? `- Volume: ${poolVolume} mil litros` : '- Volume: Não informado'}
${ph != null ? `- pH: ${ph}` : '- pH: Não medido'}
${cloro != null ? `- Cloro Livre: ${cloro} ppm` : '- Cloro Livre: Não medido'}
${alcalinidade != null ? `- Alcalinidade Total: ${alcalinidade} ppm` : '- Alcalinidade Total: Não medida'}
${description ? `\nDescrição visual: ${description}` : ''}
${imageBase64 ? '\n(Análise da imagem também será considerada)' : ''}

FORMATO DE SAÍDA OBRIGATÓRIO:
A sua resposta DEVE ser exclusivamente um objeto JSON válido, sem nenhum texto, explicação ou formatação antes ou depois do código JSON. A estrutura do JSON deve seguir obrigatoriamente o seguinte modelo:

{
  "diagnostico": {
    "titulo": "Um título curto e direto para o problema principal.",
    "descricao": "Uma explicação clara e concisa do que está acontecendo na piscina e por quê, baseada nos dados fornecidos.",
    "status_geral": "CRITICO|ALERTA|OK"
  },
  "parametros": [
    {
      "parametro": "pH",
      "valor": ${ph || 'null'},
      "status": "BAIXO|IDEAL|ALTO",
      "faixa_ideal": "7.2 - 7.6"
    },
    {
      "parametro": "Alcalinidade",
      "valor": ${alcalinidade || 'null'},
      "status": "BAIXO|IDEAL|ALTO",
      "faixa_ideal": "80 - 120 ppm"
    },
    {
      "parametro": "Cloro Livre",
      "valor": ${cloro || 'null'},
      "status": "BAIXO|IDEAL|ALTO",
      "faixa_ideal": "1 - 3 ppm"
    }
  ],
  "plano_de_acao": [
    {
      "etapa": 1,
      "titulo": "Título da primeira etapa",
      "instrucoes": "Instruções detalhadas para esta etapa específica.",
      "importancia": "CRITICA|RECOMENDADA"
    }
  ]
}

REGRAS E LIMITAÇÕES:
- Não invente dados. Se alguma informação crucial não for fornecida (ex: volume da piscina), instrua o usuário a fornecê-la ou dê instruções baseadas em uma estimativa padrão, informando que é uma estimativa.
- Não recomende marcas de produtos, apenas o tipo de produto químico (ex: 'Elevador de Alcalinidade', 'Cloro Granulado').
- Mantenha as instruções em cada etapa focadas e diretas. Evite parágrafos muito longos.
- A prioridade das etapas no 'plano_de_acao' deve seguir a ordem correta do tratamento químico (ex: Alcalinidade -> pH -> Cloro).
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