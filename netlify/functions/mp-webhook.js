const mercadopago = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    // Verifica assinatura se configurado
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const signature = event.headers['x-signature'];
      if (!mercadopago.notification.validateWebhook(signature, event.body, process.env.MERCADOPAGO_WEBHOOK_SECRET)) {
        return { statusCode: 401, body: 'Assinatura inválida' };
      }
    }

    const data = JSON.parse(event.body);
    
    // Só processa pagamentos aprovados
    if (data.action === 'payment.updated' && data.data.status === 'approved') {
      const paymentId = data.data.id;
      
      // Busca detalhes do pagamento
      const payment = await mercadopago.payment.get(paymentId);
      const metadata = payment.body.metadata;
      
      // Adiciona deck ao usuário
      const { data: deckData, error } = await supabase
        .from('user_decks')
        .insert([{
          user_id: metadata.user_id,
          name: metadata.deck_name,
          file_path: metadata.deck_file_path,
          description: metadata.deck_description
        }]);
      
      if (error) throw error;
      
      return { statusCode: 200, body: 'OK' };
    }
    
    return { statusCode: 200, body: 'Evento não processado' };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};