exports.handler = async function (event, context) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found");
    }

    console.log("🔍 Recebendo requisição...");

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
        textoAlternativas = `Adicionalemente explique sucintamente o motivo das outras alternativas estarem erradas. A única certa é ${resp}. Seguem todas as alternativas: ${respAlternativas}`;
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
      body: JSON.stringify({ resposta }),
    };
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
