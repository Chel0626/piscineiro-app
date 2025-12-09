// CORREÇÃO: Importa o logger diretamente do pacote principal.
import { logger } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { VertexAI, HarmCategory, HarmBlockThreshold, GenerateContentRequest } from "@google-cloud/vertexai";

initializeApp();

// Inicialize o Vertex AI
const vertex_ai = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "us-central1",
});

const model = "gemini-1.5-flash-001";

// Configuração para o modelo generativo
const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig: {
    "maxOutputTokens": 8192,
    "temperature": 1,
    "topP": 0.95,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

export const gerarPlanoDeAcao = onCall(async (request) => {
  logger.info("Iniciando a função gerarPlanoDeAcao", { structuredData: true });

  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Você precisa estar autenticado para executar esta ação."
    );
  }

  const { imageUrl, poolVolume, ph, cloro, alcalinidade } = request.data;
  if (!imageUrl || !poolVolume || ph == null || cloro == null || alcalinidade == null) {
    throw new HttpsError(
      "invalid-argument",
      "Dados incompletos foram enviados."
    );
  }

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
    1.  Um diagnóstico claro da situação atual da água (ex: "Água verde com
        sinais de algas", "Parâmetros desbalanceados", "Água aparentemente
        cristalina mas com cloro baixo").
    2.  Um plano de ação passo a passo para um piscineiro profissional.
    3.  Se necessário, calcule as dosagens exatas dos produtos químicos,
        considerando o volume da piscina.
    4.  Apresente a resposta final em formato Markdown para fácil leitura.
  `;
  
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const imagePart = {
    inlineData: {
      mimeType: imageResponse.headers.get("content-type") || "image/jpeg",
      data: Buffer.from(imageBuffer).toString("base64"),
    },
  };

  const requestPayload: GenerateContentRequest = {
    contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }],
  };

  try {
    logger.info("Enviando requisição para a API do Gemini...");
    const result = await generativeModel.generateContent(requestPayload);
    const responseText = result.response.candidates?.[0].content.parts[0].text;

    if (!responseText) {
      throw new HttpsError("internal", "A IA não retornou uma resposta válida.");
    }

    logger.info("Resposta recebida da IA com sucesso.");
    return { plan: responseText };
  } catch (error) {
    logger.error("Erro ao chamar a API do Gemini:", error);
    throw new HttpsError("internal", "Falha ao se comunicar com o serviço de IA.");
  }
});

export * from './cleanup';