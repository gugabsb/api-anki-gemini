const { createClient } = require('@supabase/supabase-js');

exports.handler = async(event) => {
    const { code, state } = event.queryStringParameters;

    // Recupera o code_verifier (enviado via query param pelo frontend)
    const codeVerifier = new URLSearchParams(event.rawQuery).get('code_verifier');
    if (!codeVerifier) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'code_verifier não encontrado' }),
        };
    }

    const supabase = createClient(
        'https://plupzqjkynaprsluelwt.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdXB6cWpreW5hcHJzbHVlbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjgyMzksImV4cCI6MjA1OTYwNDIzOX0.GDJmALkTV7J6bYWtJyjEKq5XeX-nL5dIDm-us3ntRLI'
    );

    try {
        const { data, error } = await supabase.auth.exchangeCodeForSession({
            code,
            code_verifier: codeVerifier, // Agora com PKCE!
        });

        if (error) throw error;

        return {
            statusCode: 302,
            headers: {
                'Location': 'https://app.estudecomanki.com.br/auth/callback',
                'Set-Cookie': `sb-access-token=${data.session.access_token}; Path=/; Secure; HttpOnly, sb-refresh-token=${data.session.refresh_token}; Path=/; Secure; HttpOnly`,
            },
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Falha na autenticação: ' + error.message }),
        };
    }
};