-- ==========================================
-- DESBLOQUEAR PERFIS (RLS ELITE MASTER)
-- ==========================================

-- 1. DESATIVAR RLS (OPÇÃO RÁPIDA PARA GRUPO DE AMIGOS)
-- Recomendo esta opção para que os teus amigos possam mudar fotos/nomes agora mesmo!
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE palpites DISABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE banca_transacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE banca_transferencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE banca_particoes DISABLE ROW LEVEL SECURITY;

-- 2. GARANTIR QUE O STORAGE TAMBÉM ESTÁ ABERTO
-- Re-abre as portas do bucket 'fotos' se necessário:
CREATE POLICY "Liberdade de Fotos Elite"
ON storage.objects FOR ALL
USING ( bucket_id = 'fotos' );
