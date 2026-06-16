import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const content = fs.readFileSync('/Users/luis/Documents/Antigravity/Liga ELite/liga-elite-app/src/lib/supabaseClient.js', 'utf8');
const urlMatch = content.match(/supabaseUrl = ['"]([^'"]+)['"]/);
const keyMatch = content.match(/supabaseAnonKey = ['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  async function test() {
    console.log("Testing executeTransfer...");
    const amount = 10;
    const de = "BANCO";
    const para = "CASA";
    
    // 1. insert transfer
    const { error: trError, data } = await supabase.from("banca_transferencias").insert([{
      valor: amount,
      origem: de,
      destino: para,
      data: new Date().toISOString()
    }]).select();
    
    console.log("Insert result:", { data, error: trError });
    if (trError) return;
    
    // 2. update particoes
    const { data: pData } = await supabase.from("banca_particoes").select("*").eq("id", 1).single();
    console.log("Current partitions:", pData);
    
    // (mocking the update)
    const updates = {};
    if (de === "BANCO") updates.banco_valor = pData.banco_valor - amount;
    else updates.casa_valor = pData.casa_valor - amount;

    if (para === "BANCO") updates.banco_valor = (updates.banco_valor || pData.banco_valor) + amount;
    else updates.casa_valor = (updates.casa_valor || pData.casa_valor) + amount;
    
    console.log("Updates:", updates);
    
    const { error: pError } = await supabase.from("banca_particoes").update(updates).eq("id", 1);
    console.log("Update partitions result:", { error: pError });
  }
  
  test();
} else {
  console.log("Could not find supabase credentials");
}
