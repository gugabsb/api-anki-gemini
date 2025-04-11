const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase configurado com Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { deck_id, deck_price, deck_name, user_id, user_email } = body;

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!mpAccessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'MERCADOPAGO_ACCESS_TOKEN não está definido' })
      };
    }

    const idempotencyKey = `${user_id}-${deck_id}`; // ou use UUID aleatório

    const { data } = await axios.post(
    'https://api.mercadopago.com/v1/payments',
    {
        transaction_amount: Number(deck_price),
        description: `Compra do deck: ${deck_name}`,
        payment_method_id: 'pix',
        payer: { email: user_email },
        notification_url: 'https://app.estudecomanki.com.br/.netlify/functions/webhook-pix',
        metadata: { deckId: deck_id, userId: user_id }
    },
    {
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpAccessToken}`,
        'X-Idempotency-Key': idempotencyKey
        }
    }
    );

    const qrData = data?.point_of_interaction?.transaction_data;

    if (!qrData?.qr_code_base64) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'QR Code não encontrado na resposta', data })
      };
    }
    await supabase.from('transactions').insert({
        payment_id: data.id,
        user_id: user_id,
        deck_id: deck_id,
        amount: deck_price,
        status: 'pending',
        pix_code: qrData?.qr_code,
        pix_expiration: data.date_of_expiration,
        metadata: data
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        qr_code: qrData.qr_code,
        qr_code_base64: qrData.qr_code_base64
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Erro desconhecido', detalhe: err.response?.data })
    };
  }
};
