-- REPARAÇÃO DE ELITE: RESTAURAÇÃO DE DATAS NA BANCA
-- CORRE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE PARA ATIVAR O HISTÓRICO

-- 1. Garante que a coluna created_at existe com timestamp automático
ALTER TABLE IF EXISTS banca_transacoes 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Garante que a coluna pago existe (se não existir)
ALTER TABLE IF EXISTS banca_transacoes 
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT TRUE;

-- 3. Atualiza os registos antigos que podem estar nulos
UPDATE banca_transacoes SET created_at = NOW() WHERE created_at IS NULL;

-- 4. Notifica o PostgREST para limpar o cache de schema (IMPORTANTE)
NOTIFY pgrst, 'reload schema';
