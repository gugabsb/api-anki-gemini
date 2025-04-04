const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.UPSTASH_URL, token: process.env.UPSTASH_TOKEN });


exports.handler = async function (event, context) {
  try {

    // Tratamento para requisições OPTIONS (CORS)
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: "",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found");
    }

    if (!event.body) {
      console.error("❌ Erro: event.body está vazio!");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is empty" }),
      };
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (jsonError) {
      console.error("❌ Erro ao fazer JSON.parse(event.body):", jsonError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { texto, respAlternativas, resp, id, hash } = requestBody;

    if (!texto || !resp || !id || !hash) {
      console.error("❌ Erro: Parâmetros inválidos!", requestBody);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters (texto, resp, id)" }),
      };
    }

    // Verificar se já existe resposta em cache
    const cachedResponse = await redis.get(`question:${id}`);
    if (cachedResponse) {
      console.log("✅ Retornando resposta do cache para ID:", id);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resposta: cachedResponse, cached: true }),
      };
    }

    let textoAlternativas = "";
    if (respAlternativas !== "0") {
      const matches = respAlternativas.match(/;/g);
      if (matches !== null && matches.length > 2) {
        textoAlternativas = `Adicionalmente, explique sucintamente o motivo das outras alternativas estarem erradas. A única certa é ${resp}. Seguem todas as alternativas: ${respAlternativas}`;
      } else {
        textoAlternativas = "Comente sobre o conteúdo da questão.";
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: { parts: { text: "Você é um professor que elabora questões de concurso..." } },
      contents: [{ parts: [{ text: `Questão: ${texto}. O Gabarito da questão é: ${resp}. ${textoAlternativas}` }] }],
    };

    const response = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });

    // Verificação detalhada da estrutura de resposta
    if (!response.data?.candidates || 
        !Array.isArray(response.data.candidates) || 
        !response.data.candidates[0]?.content?.parts ||
        !Array.isArray(response.data.candidates[0].content.parts)) {
      console.error("❌ Estrutura de resposta inesperada da API do Gemini", response.data);
      throw new Error("Resposta inesperada da API do Gemini");
    }
    
    const resposta = response.data.candidates[0].content.parts[0].text;
    
    
    // Armazenar no cache para futuras requisições
    await redis.set(`question:${id}`, resposta);
    console.log("✅ Resposta armazenada no cache para ID:", id);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resposta, cached: false }),
    };
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};