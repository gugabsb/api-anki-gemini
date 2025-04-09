const { createClient } = require('@supabase/supabase-js');

// Supabase configurado com Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);

    // Verifica se é um evento válido do Mercado Pago
    if (!payload || !payload.data || !payload.type) {
      return { statusCode: 400, body: 'Webhook inválido' };
    }

    // Apenas trata eventos de pagamento
    if (payload.type !== 'payment') {
      return { statusCode: 200, body: 'Evento ignorado' };
    }

    const paymentId = payload.data.id;

    // 🔍 Requisição para buscar detalhes completos do pagamento
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`
      }
    });

    const payment = await paymentRes.json();

    // Verifica se o pagamento foi aprovado
    if (payment.status !== 'approved') {
      return { statusCode: 200, body: `Pagamento ainda não aprovado (${payment.status})` };
    }

    const deckId = payment.metadata?.deck_id;
    const userId = payment.metadata?.user_id;

    if (!deckId || !userId) {
      console.error('⚠️ Metadados ausentes:', payment.metadata);
      return { statusCode: 400, body: 'Metadados incompletos no pagamento' };
    }

    // Busca dados do deck para verificar se está ativo
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, title, description, file_path, price, is_active')
      .eq('id', deckId)
      .single();

    if (deckError || !deck) {
      console.error('❌ Deck não encontrado:', deckError);
      return { statusCode: 404, body: 'Deck não encontrado' };
    }

    if (!deck.is_active) {
      console.error('❌ Deck inativo:', deckId);
      return { statusCode: 400, body: 'Este deck não está disponível para compra' };
    }

    // Inicia transação para garantir atomicidade das operações
    const { data: transactionData, error: transactionError } = await supabase.rpc('handle_payment_webhook', {
      payment_data: {
        payment_id: payment.id,
        user_id: userId,
        deck_id: deckId,
        amount: deck.price,
        status: 'paid',
        pix_code: payment.point_of_interaction?.transaction_data?.qr_code,
        pix_expiration: payment.date_of_expiration,
        metadata: payment
      },
      deck_data: {
        title: deck.title,
        description: deck.description,
        file_path: deck.file_path
      }
    });

    if (transactionError) {
      console.error('❌ Erro na transação:', transactionError);
      throw transactionError;
    }

    console.log(`✅ Pagamento processado e deck atribuído para o usuário ${userId}`);
    return { statusCode: 200, body: 'OK - Pagamento processado e deck atribuído' };

  } catch (error) {
    console.error('💥 Erro geral no webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno', details: error.message })
    };
  }
};