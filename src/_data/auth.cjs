require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

module.exports = async function() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
  const { data: { session } } = await supabase.auth.getSession()
  return { user: session?.user }
}