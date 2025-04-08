const https = require('https');
const querystring = require('querystring');

exports.handler = async(event) => {
    const getCookie = (cookieString, name) => {
        const match = cookieString && cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    };

    const { queryStringParameters, headers } = event;
    const code = queryStringParameters.code;
    const codeVerifier = getCookie(headers.cookie, 'pkce_verifier');

    if (!code || !codeVerifier) {
        return {
            statusCode: 400,
            body: 'Faltando código de autorização ou code_verifier',
        };
    }

    // Aqui usamos application/x-www-form-urlencoded (obrigatório para Supabase)
    const data = querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://app.estudecomanki.com.br/.netlify/functions/auth-callback',
        code_verifier: codeVerifier
    });

    const options = {
        hostname: 'plupzqjkynaprsluelwt.supabase.co',
        path: '/auth/v1/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data),
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdXB6cWpreW5hcHJzbHVlbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjgyMzksImV4cCI6MjA1OTYwNDIzOX0.GDJmALkTV7J6bYWtJyjEKq5XeX-nL5dIDm-us3ntRLI'
        }
    };

    const responseBody = await new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });

    const responseJson = JSON.parse(responseBody);

    if (responseJson.error) {
        return {
            statusCode: 500,
            body: `Tokens não recebidos da Supabase. Detalhes: ${JSON.stringify(responseJson)}`
        };
    }

    const accessToken = responseJson.access_token;
    const refreshToken = responseJson.refresh_token;

    return {
        statusCode: 302,
        multiValueHeaders: {
            'Set-Cookie': [
                `sb-access-token=${accessToken}; Path=/; SameSite=Strict`,
                `sb-refresh-token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict`,
                'pkce_verifier=; Path=/; Max-Age=0'
            ],
            'Location': ['/auth/callback']
        },
        body: ''
    };
};