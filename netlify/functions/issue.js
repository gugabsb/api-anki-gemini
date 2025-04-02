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

        const {id, issue, usuario} = requestBody;

        if (!id) {
            console.error("❌ Erro: Parâmetros inválidos!", requestBody);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters (id)" }),
            };
        }

        if (issue) {
            // Verifica se o usuário está vazio
            if (usuario == "" || usuario == null){
                nomeUsuario = 'Anônimo';
            }else{
                nomeUsuario = usuario;
            }

            //cria data e hora
            const agora = new Date();
            const dia = String(agora.getDate()).padStart(2, '0');
            const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
            const horas = String(agora.getHours()).padStart(2, '0');
            const minutos = String(agora.getMinutes()).padStart(2, '0');
            dtformatada =  `${dia}/${mes} ${horas}:${minutos}`;
            // Armazena no bd
            await redis.lpush(
                `issue:${id}`,
                JSON.stringify({
                  data: dtformatada,
                  issue: issue,
                  usuario: nomeUsuario
                })
              );
            console.log("✅ Issue armazenada no bd para ID:", id);
        }
        textoResposta = "Obrigado por reportar, vamos verificar o quanto antes!";
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ resposta: textoResposta, cached: false }),
        };
    
    } catch (error) {
        console.error("❌ Erro:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno do servidor" }),
        };
    }
};