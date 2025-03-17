const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

exports.handler = async function (event, context) {
  try {
    const apiKey = process.env.GEMINI_API_KEY; // Obtém a chave da variável de ambiente
    if (!apiKey) {
      throw new Error("API key not found");
    }
    const { texto, respAlternativas, resp } = JSON.parse(event.body);
    let textoAlternativas = "";
    if (respAlternativas !== "0") {
      const matches = respAlternativas.match(/;/g);
      if (matches !== null && matches.length > 2) {
        textoAlternativas = `Adicionalemente explique sucintamente o motivo das outras alternativas estarem erradas, importante a única certa é a ${resp}, todas as demais estão erradas, segue todas elas: ${respAlternativas}`;
      } else {
        textoAlternativas = "Comente sobre o conteúdo da questão.";
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      system_instruction: { parts: { text: "Você é um professor que elabora questões de concurso, agora está ajudando estudantes a estudarem considerando questões aplicadas em outras provas, responda de forma impessoal." } },
      contents: [{ parts: [{ text: `Questão: ${texto}. O Gabarito da questão é: ${resp}. ${textoAlternativas}` }] }],
    };

    const response = await axios.post(url, requestBody, { headers: { "Content-Type": "application/json" } });
    const resposta = response.data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ resposta }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};