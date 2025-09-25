import { NextResponse, type NextRequest } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não está definida.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, poolVolume, ph, cloro, alcalinidade, description } = body;

    if ((!imageBase64 && !description) || (poolVolume == null && ph == null && cloro == null && alcalinidade == null)) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
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

    const prompt = `Você é um especialista em piscinas. Analise os dados e retorne APENAS um JSON válido:

DADOS:
- Volume: ${poolVolume || 'N/A'} mil litros
- pH: ${ph || 'N/A'}
- Cloro: ${cloro || 'N/A'} ppm  
- Alcalinidade: ${alcalinidade || 'N/A'} ppm
${description ? `- Descrição: ${description}` : ''}

FORMATO OBRIGATÓRIO (apenas JSON):
{
  "diagnostico": {
    "titulo": "Problema principal",
    "descricao": "Explicação do problema",
    "status_geral": "CRITICO|ALERTA|OK"
  },
  "acoes": [
    {
      "tipo": "PRODUTO|ACAO|MANUTENCAO",
      "titulo": "Nome da ação",
      "descricao": "Como fazer",
      "prioridade": "ALTA|MEDIA|BAIXA",
      "produto": "Nome do produto (se aplicável)",
      "quantidade": "Quantidade específica",
      "unidade": "ml|g|kg|litros"
    }
  ],
  "observacoes": "Dicas importantes"
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`;

    let parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonResponse = JSON.parse(text);
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          return NextResponse.json(extractedJson);
        } catch {
          // fallback
        }
      }

      return NextResponse.json({
        diagnostico: {
          titulo: "Análise Geral", 
          descricao: text.substring(0, 200),
          status_geral: "ALERTA"
        },
        acoes: [{
          tipo: "ACAO",
          titulo: "Verificar parâmetros",
          descricao: "Consulte um profissional",
          prioridade: "MEDIA",
          produto: "",
          quantidade: "",
          unidade: ""
        }],
        observacoes: "Erro no processamento da resposta"
      });
    }

  } catch (error) {
    console.error('Erro na API generate-plan:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
