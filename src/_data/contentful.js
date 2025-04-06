import { createClient } from 'contentful';
import * as dotenv from 'dotenv';

dotenv.config();

export default async function() {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  try {
    const entries = await client.getEntries({ 
        content_type: 'flashcardDeck' // Ajuste para seu content type
    });

    // Adicione no try-catch
    if (!entries?.items) {
        console.warn('Nenhum deck encontrado no Contentful');
        return [];
    }
    // Adicione no final da função, antes do return
    console.log('Dados do Contentful:', entries.items.map(d => d.fields.title));
    return entries.items;
  } catch (error) {
    console.error('Erro ao buscar dados do Contentful:', error);
    return [];
  }
}