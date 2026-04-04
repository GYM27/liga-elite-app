-- Tabela para guardar o veredito final de cada época
CREATE TABLE IF NOT EXISTS historico_epocas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_epoca TEXT NOT NULL, -- Ex: "2025/2026"
    saldo_final DECIMAL(10,2) NOT NULL,
    vencedor_norte TEXT,
    vencedor_sul TEXT,
    ranking_json JSONB NOT NULL, -- Guarda o ranking completo de todos os jogadores
    data_encerramento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Adicionar permissões de leitura pública
ALTER TABLE historico_epocas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública Histórico" ON historico_epocas FOR SELECT USING (true);
