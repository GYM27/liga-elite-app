import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyjceicuvlydamjxpntl.supabase.co', 'sb_publishable_PrbIBLRWa8__u_cS0mCUYQ_WtKmdMMx');
async function test() {
  const { data, error } = await supabase.from('ranking_atual').select('*').limit(1);
  console.log('ranking_atual', data, error);
}
test();
