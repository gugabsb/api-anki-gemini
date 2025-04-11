import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function() {
  
  //return { items: [] };

  try {
    const { data: decks, error } = await supabase
      .from('decks')
      .select(`
        id,
        title,
        description,
        price,
        file_path,
        image_path,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      items: decks.map(deck => ({
        sys: { id: deck.id },
        fields: {
          title: deck.title,
          description: deck.description,
          price: deck.price,
          filePath: deck.file_path,
          image: deck.image_path ? { 
            fields: { 
              file: { 
                url: `${process.env.SUPABASE_STORAGE_IMAGE_URL}${deck.image_path}${deck.id}.png` 
              } 
            } 
          } : null
        }
      }))
    };

  } catch (error) {
    console.error('Erro ao buscar decks:', error);
    return { items: [] };
  }
}