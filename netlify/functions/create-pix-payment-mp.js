const mercadopago = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

exports.handler = async function(event, context) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  // Verificar autenticação
  const { user } = context.clientContext;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) };
  }

  try {
    const { deck_id, deck_price, deck_name, deck_file_path, deck_description } = JSON.parse(event.body);

    // Criar preferência de pagamento
    const paymentData = {
      transaction_amount: parseFloat(deck_price),
      description: `Deck: ${deck_name}`,
      payment_method_id: 'pix',
      payer: {
        email: user.email,
        first_name: user.user_metadata?.full_name || user.email.split('@')[0],
      },
      metadata: {
        user_id: user.sub,
        deck_id: deck_id,
        deck_name: deck_name,
        deck_file_path: deck_file_path,
        deck_description: deck_description
      },
      notification_url: `${process.env.URL}/.netlify/functions/mp-webhook`,
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos para pagar
    };

    const response = await mercadopago.payment.create(paymentData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: response.body.id,
        qr_code_base64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_code: response.body.point_of_interaction?.transaction_data?.emv,
        expiration_date: response.body.date_of_expiration
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        full_error: error 
      })
    };
  }
};