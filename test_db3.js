import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const run = async () => {
  const { data } = await supabase.from('historico_epocas').select('ranking_json').limit(1);
  console.log(JSON.stringify(data?.[0]?.ranking_json?.[0], null, 2));
}
run();
