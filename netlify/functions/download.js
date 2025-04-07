const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  try {
    // 1. Extrai o token JWT dos headers ou cookies
    const authHeader = event.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1]
      : event.headers.cookie?.match(/sb-access-token=([^;]+)/)?.[1];

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token de acesso não fornecido' })
      };
    }

   // Adicione no início da função, antes da verificação do usuário
    if (event.path.endsWith('/sample')) {
        const { data: { signedUrl } } = await supabase
        .storage
        .from('decks')
        .createSignedUrl('exemplo.apkg', 3600); // 1 hora de validade
    
        return {
        statusCode: 302,
        headers: { Location: signedUrl }
        };
    } 

    // 2. Verifica o usuário com o token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Não autorizado' })
      };
    }

    console.log("A1");

    // 3. Processa o download (código existente)
    const deckId = event.path.split('/').pop();
    const { data: deck, error: deckError } = await supabase
      .from('user_decks')
      .select('file_path')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single();

 

    if (deckError || !deck) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Deck não encontrado' })
      };
    }
    console.log("signedUrl::::")
    //console.log(signedUrl)

    //console.log("signedUrl>"+signedUrl);
    console.log("deck.file_path>"+deck.file_path);

    // 4. Gera URL assinada
    const { data: { signedUrl }, error: urlError } = await supabase
      .storage
      .from('decks')
      .createSignedUrl(deck.file_path, 900); // 15 minutos




    if (urlError) throw urlError;

    return {
      statusCode: 302,
      headers: {
        Location: signedUrl
      }
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro interno',
        details: error.message
      })
    };
  }
};