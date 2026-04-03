import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hyjceicuvlydamjxpntl.supabase.co';
const supabaseKey = 'sb_publishable_FHmbPAK1ynhjq15NRcwzWA_uqfWWQPK'; // Ensure this is the SERVICE KEY if needed, otherwise ANON key might be enough for simple inserts if RLS is off.
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_PATH = 'c:/Apostas Grupo/GRUPO APOSTAS - HistoricoApostas.csv';

const playerMapping = {
  'Victoria': '3a3b23e5-89be-4b57-8226-a2ba96f60095',
  'Rui Palheira': 'a5b53e4f-2c22-40d4-94bf-1e47b1694ba5',
  'Leandro': '74731d77-cf8b-4ced-ac19-df63672fa7d8',
  'Sampaio': 'c7de059b-8825-492b-bc87-673da64a74cf',
  'Luis Ferreira': '7ace5c10-ff80-4f69-9530-ad3be6e2677c',
  'Filipe': '1502366f-2712-4b9c-b493-a12bc59102a5',
  'Vilao': 'b70ff769-09eb-43fa-b96f-aa586ef1500c',
  'Quaresma': '6d3a4d8a-6f71-456f-a6e9-0ee4d66ceec2',
  'CINTRA': 'fd9d0865-60ff-462e-94c9-b1125d4d108d',
  'Orlando': 'af6f70c7-343e-48c8-b622-f98fe414e456',
  'Luis Pereira': '30578fcb-c451-42f5-b48d-74c9c6fb17db',
  'Esteves': 'ff764546-0ebe-496f-9cf1-29521ae0a1f9'
};

async function importData() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  
  const palpitesToInsert = [];
  const bancaToInsert = [];

  console.log('⏳ Parsing CSV data...');

  // Player columns in order (Victoria is index 2, etc.)
  const playerNamesInHeader = [
    'Victoria', 'Rui Palheira', 'Leandro', 'Sampaio', 
    'Luis Ferreira', 'Filipe', 'Vilao', 'Quaresma', 
    'CINTRA', 'Orlando', 'Luis Pereira', 'Esteves'
  ];

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const weekStr = parts[1];
    const semana = parseInt(weekStr);

    if (isNaN(semana)) continue; // Skip non-week rows (month headers, totals)

    // 1. Process Palpites
    playerNamesInHeader.forEach((name, idx) => {
      const resultCell = parts[idx + 2] ? parts[idx + 2].toUpperCase() : '';
      if (resultCell === 'G' || resultCell === 'R') {
        palpitesToInsert.push({
          jogador_id: playerMapping[name],
          semana: semana,
          jogo: 'Histórico (CSV)',
          aposta: 'Histórico (CSV)',
          resultado_individual: resultCell === 'G' ? 'GREEN' : 'RED',
          liga_no_momento: idx < 6 ? 'Norte' : 'Sul' // Adjust based on your liga structure in CSV
        });
      }
    });

    // 2. Process Banca (Norte Gain)
    const norteGainStr = parts[14];
    if (norteGainStr && norteGainStr !== '0' && norteGainStr !== '""') {
        const value = parseFloat(norteGainStr.replace(/"/g, '').replace(',', '.'));
        if (!isNaN(value) && value > 0) {
            bancaToInsert.push({
                valor: value,
                tipo: 'ENTRADA',
                descricao: `Ganho Liga Norte (Semana ${semana})`
            });
        }
    }

    // 3. Process Banca (Sul Gain)
    const sulGainStr = parts[15];
    if (sulGainStr && sulGainStr !== '0' && sulGainStr !== '""') {
        const value = parseFloat(sulGainStr.replace(/"/g, '').replace(',', '.'));
        if (!isNaN(value) && value > 0) {
            bancaToInsert.push({
                valor: value,
                tipo: 'ENTRADA',
                descricao: `Ganho Liga Sul (Semana ${semana})`
            });
        }
    }
  }

  console.log(`🚀 Ready to insert ${palpitesToInsert.length} palpites and ${bancaToInsert.length} financial records.`);

  // Insert Palpites in chunks
  const chunkSize = 50;
  for (let i = 0; i < palpitesToInsert.length; i += chunkSize) {
    const chunk = palpitesToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('palpites').insert(chunk);
    if (error) console.error(`❌ Error inserting palpites chunk: ${error.message}`);
    else console.log(`✅ Inserted ${i + chunk.length}/${palpitesToInsert.length} palpites...`);
  }

  // Insert Banca
  if (bancaToInsert.length > 0) {
    const { error } = await supabase.from('banca').insert(bancaToInsert);
    if (error) console.error(`❌ Error inserting banca: ${error.message}`);
    else console.log(`✅ Inserted all financial records.`);
  }

  console.log('🏁 Migration complete!');
}

importData();
