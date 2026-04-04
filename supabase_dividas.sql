-- Adicionar campos de controlo financeiro por jogador
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS divida DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS motivo_divida TEXT DEFAULT '';

-- Garantir que as permissões de leitura continuam públicas
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública Jogadores Dívidas" ON jogadores FOR SELECT USING (true);
