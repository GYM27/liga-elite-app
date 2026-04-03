import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyjceicuvlydamjxpntl.supabase.co';
const supabaseKey = 'sb_publishable_FHmbPAK1ynhjq15NRcwzWA_uqfWWQPK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function adjustBanca() {
    const TARGET_BALANCE = 413.30;
    
    console.log(`🎯 Objetivo: Ajustar saldo total para ${TARGET_BALANCE}€`);

    // 1. Calcular saldo atual
    const { data: banca, error: errB } = await supabase.from('banca').select('valor, tipo');
    if (errB) {
        console.error('Erro ao ler banca:', errB.message);
        return;
    }

    const currentBalance = banca.reduce((acc, curr) => {
        return curr.tipo === 'ENTRADA' ? acc + Number(curr.valor) : acc - Number(curr.valor);
    }, 0);

    console.log(`📊 Saldo atual em sistema: ${currentBalance.toFixed(2)}€`);

    const difference = TARGET_BALANCE - currentBalance;

    if (Math.abs(difference) < 0.01) {
        console.log('✅ O saldo já está correto!');
        return;
    }

    console.log(`➕ Diferença a ajustar: ${difference.toFixed(2)}€`);

    // 2. Inserir ajuste
    const { error: errI } = await supabase.from('banca').insert({
        valor: Math.abs(difference),
        tipo: difference > 0 ? 'ENTRADA' : 'SAIDA',
        descricao: 'Ajuste de Saldo Inicial / Semana Atual (Manual)'
    });

    if (errI) {
        console.error('Erro ao inserir ajuste:', errI.message);
    } else {
        console.log(`🚀 Ajuste de ${difference.toFixed(2)}€ inserido com sucesso!`);
        console.log(`✨ Novo Saldo Total: ${TARGET_BALANCE}€`);
    }
}

adjustBanca();
