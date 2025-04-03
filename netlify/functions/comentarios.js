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

        const {id, texto, usuario, hash} = requestBody;

        if (!id) {
            console.error("❌ Erro: Parâmetros inválidos!", requestBody);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required parameters (id)" }),
            };
        }

        if (texto) {
            // Verifica se o usuário está vazio
            if (usuario == "" || usuario == null){
                nomeUsuario = 'Anônimo';
            }else{
                nomeUsuario = usuario;
            }

            // Armazenar comentários no bd
            // Remove tags HTML
            textoFormatado = texto.replace(/<[^>]*>/g, '');
            textoFormatado = textoFormatado.replace(/'/g, "\\'");
            //cria data e hora
            const agora = new Date();
            const dia = String(agora.getDate()).padStart(2, '0');
            const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
            const horas = String(agora.getHours()).padStart(2, '0');
            const minutos = String(agora.getMinutes()).padStart(2, '0');
            dtformatada =  `${dia}/${mes} ${horas}:${minutos}`;
            // Armazena no bd
            await redis.lpush(
                `comentarios:${id}`,
                JSON.stringify({
                  data: dtformatada,
                  texto: textoFormatado,
                  usuario: nomeUsuario,
                  hash: hash
                })
              );
            console.log("✅ Comentários armazenados no bd para ID:", id);
        }

        // Verificar se já existe comentários no bd
        const comentarios = await redis.lrange(`comentarios:${id}`, 0, -1);
        if (comentarios) {
            console.log("✅ Retornando comentários do bd para ID:", id);
            textoResposta = comentarios;
        }else{
            console.log("✅ Retornando sem comentários para ID:", id);
            textoResposta = "Não há comentários sobre esta questão.";
        }

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