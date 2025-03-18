const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

exports.handler = async function (event, context) {
  try {
    console.log("🔍 Recebendo requisição...");
    console.log("🔍 event: ", JSON.stringify(event, null, 2)); // Log detalhado

    // Tratamento para requisições OPTIONS (CORS)
    if (event.httpMethod === "OPTIONS") {
      console.log("✅ Requisição OPTIONS recebida. Respondendo com cabeçalhos CORS.");
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

    console.log("✅ event.body recebido:", event.body);

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

    const { texto, respAlternativas, resp } = requestBody;

    if (!texto || !resp) {
      console.error("❌ Erro: Parâmetros inválidos!", requestBody);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
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

    console.log("✅ Parâmetros processados com sucesso!");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: { parts: { text: "Você é um professor que elabora questões de concurso..." } },
      contents: [{ parts: [{ text: `Questão: ${texto}. O Gabarito da questão é: ${resp}. ${textoAlternativas}` }] }],
    };

    console.log("🚀 Enviando requisição para API Gemini...");

    const response = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });

    if (!response.data || !response.data.candidates) {
      console.error("❌ Resposta inesperada da API do Gemini", response.data);
      throw new Error("Resposta inesperada da API do Gemini");
    }

    const resposta = response.data.candidates[0].content.parts[0].text;
    console.log("✅ Resposta recebida com sucesso!");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Permite requisições de qualquer origem
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resposta }),
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
