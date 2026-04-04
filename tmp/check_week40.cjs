const { createClient } = require('@supabase/supabase-client');
const supabase = createClient('https://hyjceicuvlydamjxpntl.supabase.co', 'sb_publishable_FHmbPAK1ynhjq15NRcwzWA_uqfWWQPK');
async function run() {
  const { data: config } = await supabase.from('config').select('*').eq('chave', 'semana_atual').single();
  const { count: sem40 } = await supabase.from('palpites').select('*', { count: 'exact', head: true }).eq('semana', 40);
  const { count: sem14 } = await supabase.from('palpites').select('*', { count: 'exact', head: true }).eq('semana', 14);
  const { data: recent } = await supabase.from('palpites').select('semana').order('semana', { ascending: false }).limit(1);
  console.log(JSON.stringify({ config, sem40, sem14, recent }));
}
run();
