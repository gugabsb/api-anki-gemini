const { createClient } = require('@supabase/supabase-js');

let supabase;

const initSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      'https://plupzqjkynaprsluelwt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdXB6cWpreW5hcHJzbHVlbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjgyMzksImV4cCI6MjA1OTYwNDIzOX0.GDJmALkTV7J6bYWtJyjEKq5XeX-nL5dIDm-us3ntRLI'
    );
  }
  return supabase;
};

exports.handler = async (event) => {
  try {
    const client = initSupabase();
    const token = event.headers.authorization?.split('Bearer ')[1];
    const { data: { user } } = await client.auth.getUser(token);
    
    return {
      statusCode: user ? 200 : 401,
      body: JSON.stringify(user)
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};