import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyjceicuvlydamjxpntl.supabase.co';
const supabaseKey = 'sb_publishable_FHmbPAK1ynhjq15NRcwzWA_uqfWWQPK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('--- RELATÓRIO DA BASE DE DADOS (LIGA DE ELITE) ---');
  
  try {
    // 1. Jogadores
    const { data: jogadores, error: errJ } = await supabase.from('jogadores').select('nome, liga_atual');
    console.log('\n✅ Jogadores:', errJ ? 'Erro: ' + errJ.message : (jogadores?.length > 0 ? jogadores : 'Nenhum jogador encontrado.'));

    // 2. Palpites (Teste geral sem filtro de semana)
    const { data: palpites, error: errP } = await supabase.from('palpites').select('jogo, aposta, resultado_individual, semana');
    console.log('\n✅ Palpites:', errP ? 'Erro: ' + errP.message : (palpites?.length > 0 ? palpites : 'Sem palpites registados.'));

    // 3. Banca
    const { data: banca, error: errB } = await supabase.from('banca').select('valor, tipo');
    console.log('\n✅ Banca:', errB ? 'Erro: ' + errB.message : (banca?.length > 0 ? banca : 'Sem transações financeiras.'));

    // 4. Ranking (Testar a View)
    const { data: ranking, error: errR } = await supabase.from('ranking_atual').select('*');
    console.log('\n✅ View Ranking:', errR ? 'Erro: ' + errR.message : (ranking?.length > 0 ? ranking : 'Ranking está vazio.'));
    
  } catch (err) {
    console.error('Erro ao conectar ao Supabase:', err.message);
  }
}

checkDatabase();
