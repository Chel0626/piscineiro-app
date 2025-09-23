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
      Você é um piscineiro certificado com 20 anos de experiência em tratamento de água
      e manutenção de piscinas, seguindo normas da ANAP. Você conhece profundamente 
      produtos das principais marcas como Genco, HTH, Hidroazul e ANAP.

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
      - Analise os parâmetros usando terminologia técnica (registros de fundo, skimmers, casa de bombas)
      - Identifique correlações entre pH, cloro e alcalinidade
      - ${poolVolume ? `Calcule dosagens baseadas no volume de ${poolVolume} mil litros` : 'Indique a importância de conhecer o volume para dosagens precisas'}
      - Determine possíveis causas da desregulação dos parâmetros

      ### **Etapa 2: Método de Recuperação**
      **A IA deve avaliar e escolher UM dos caminhos abaixo:**

      #### **Opção A - Decantação:**
      - **Produto recomendado:** Sulfato de alumínio (ex: Genco Clarificante) ou floculante (ex: HTH Clear Gel)?
      - **Cálculo de dosagem:** ${poolVolume ? `Para ${poolVolume} mil litros: [quantidade específica]` : '[X] gramas por mil litros × volume da piscina'}
      - **Procedimento técnico:** 
        * Sulfato = filtro na posição RECIRCULAR por 4-6 horas
        * Floculante = desligar filtração por 8-12 horas para sedimentação
      - **Segurança:** Use EPI adequado durante aplicação

      #### **Opção B - Recuperação com Filtração:**
      - **Método 1 - Oxidação:** ${poolVolume ? `Peróxido de hidrogênio ${Math.round(Number(poolVolume) * 1000 * 0.001)}L ou hipoclorito` : 'Peróxido 1mL/1000L ou choque clorado'}
      - **Método 2 - Clarificante:** HTH Clear Gel ou Genco Clarificante + filtração contínua 12h
      - **Correção alcalinidade:** Use Genco Alcalinizante ou HTH Alcalin Plus se alcalinidade < 80ppm
      - **Monitoramento:** Testes a cada 4 horas durante o processo

      ### **Etapa 3: Finalização**
      **Se escolheu Decantação (Opção A):**
      - Aspiração no DRENO com bomba desligada para evitar retorno à piscina
      - Lavagem completa do filtro (backwash + enxágue)
      - Reteste de parâmetros após 2 horas de circulação
      - Ajustes finais se necessário

      **Se escolheu Recuperação com Filtração (Opção B):**
      - Lavagem do elemento filtrante (areia/cartucho) obrigatória
      - Verificação do sistema de circulação (skimmers limpos, cesto da bomba)
      - Reteste completo dos parâmetros
      - Cronograma de manutenção: testes 2x/semana, limpeza semanal

      **MANUTENÇÃO PREVENTIVA:**
      - Testes regulares com kit completo (pH, cloro, alcalinidade)
      - Limpeza semanal de skimmers e registro de fundo
      - Retrolavagem quinzenal do filtro
      - Escovação das paredes semanalmente

      **IMPORTANTE:** Use sempre equipamentos de proteção, siga instruções dos fabricantes
      e mantenha produtos químicos longe de crianças e animais.
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