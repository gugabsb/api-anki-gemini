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

    // 2. Verifica o usuário com o token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Não autorizado' })
      };
    }

    const deckId = event.path.split('/').pop();

    const { data: deck, error: deckError } = await supabase
    .from('user_decks')
    .select('user_id, deck_id, decks!deck(file_path)')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .single();
    
    if (deckError || !deck) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Deck não encontrado' })
      };
    }

    const rawPath = deck.decks.file_path + deck.deck_id + '.apkg';
    const cleanedPath = rawPath.replace(/^\/?decks\//, '');
    //console.log('🧼 file_path limpo:', cleanedPath);
    
    const { data, error } = await supabase
      .storage
      .from('decks')
      .createSignedUrl(cleanedPath, 900);
    
    if (!data || !data.signedUrl) {
      console.error('❌ Signed URL não recebido:', data, error);
      return {
        statusCode: 500,
        body: 'Erro ao gerar link de download do Supabase Storage'
      };
    }
    
    return {
      statusCode: 302,
      headers: {
        Location: data.signedUrl
      }
    };


  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro interno',
        details: error.message
      })
    };
  }
};