const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar .env do projeto
dotenv.config({ path: path.join(__dirname, '..', 'c:/Apostas Grupo/.env') });

const supabaseUrl = 'https://hyjceicuvlydamjxpntl.supabase.co';
const supabaseKey = 'sb_publishable_FHmbPAK1ynhjq15NRcwzWA_uqfWWQPK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('--- RELATÓRIO DA BASE DE DADOS ---');
  
  // 1. Jogadores
  const { data: jogadores, error: errJ } = await supabase.from('jogadores').select('nome, liga_atual');
  console.log('\nJogadores:', errJ ? 'Erro: ' + errJ.message : (jogadores.length > 0 ? jogadores : 'Nenhum jogador encontrado.'));

  // 2. Palpites (Semana 14 como exemplo)
  const { data: palpites, error: errP } = await supabase.from('palpites').select('jogo, aposta, resultado_individual').eq('semana', 14);
  console.log('\nPalpites (Semana 14):', errP ? 'Erro: ' + errP.message : (palpites.length > 0 ? palpites : 'Sem palpites nesta semana.'));

  // 3. Banca
  const { data: banca, error: errB } = await supabase.from('banca').select('valor, tipo');
  console.log('\nBanca:', errB ? 'Erro: ' + errB.message : (banca.length > 0 ? banca : 'Sem transações.'));

  // 4. Ranking (Testar a View)
  const { data: ranking, error: errR } = await supabase.from('ranking_atual').select('*');
  console.log('\nView Ranking:', errR ? 'Erro: ' + errR.message : (ranking.length > 0 ? ranking : 'Ranking está vazio.'));
}

checkDatabase();
