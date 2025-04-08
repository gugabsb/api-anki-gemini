const fetch = require('node-fetch');

const testPayload = {
  action: 'payment.updated',
  data: {
    id: '123456',
    status: 'approved',
    metadata: {
      deckId: '3BohdDq3fVVtkeVcwO8bN',
      userId: 'da7bb259-1ce4-42e4-b3d1-ed18ae34648a'
    }
  }
};

async function test() {
  const response = await fetch('http://localhost:8888/.netlify/functions/webhook-pix', {
    method: 'POST',
    body: JSON.stringify(testPayload)
  });
  console.log(await response.text());
}

test();