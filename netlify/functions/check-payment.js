const mercadopago = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

// Configura o Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

exports.handler = async function(event, context) {
  // Verifica se o parâmetro paymentId foi fornecido
  const { paymentId } = event.queryStringParameters;
  if (!paymentId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'paymentId é obrigatório' })
    };
  }

  try {
    // Busca o pagamento no Mercado Pago
    const payment = await mercadopago.payment.get(paymentId);
    
    // Verifica se encontrou o pagamento
    if (!payment || !payment.body) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Pagamento não encontrado' })
      };
    }

    // Retorna o status formatado
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: payment.body.status,
        paymentId: payment.body.id,
        amount: payment.body.transaction_amount,
        dateApproved: payment.body.date_approved,
        payerEmail: payment.body.payer?.email
      })
    };
    
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro ao verificar pagamento',
        details: error.message 
      })
    };
  }
};