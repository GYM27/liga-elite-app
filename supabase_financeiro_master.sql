-- ==========================================
-- ESTRUTURA FINANCEIRA DE ELITE (BANCA MASTER)
-- ==========================================

-- 1. TABELA DE TRANSAÇÕES (MULTAS, PRÉMIOS, DESPESAS)
CREATE TABLE IF NOT EXISTS banca_transacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jogador_id UUID REFERENCES jogadores(id) ON DELETE SET NULL, 
    semana INTEGER, 
    tipo TEXT CHECK (tipo IN ('MULTA', 'PREMIO', 'MENSALIDADE', 'LEVANTAMENTO', 'OUTRO')),
    valor DECIMAL(10, 2) NOT NULL, 
    descricao TEXT, 
    data_movimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por TEXT DEFAULT 'ADMIN'
);

-- 2. TABELA DE MENSALIDADES (CONTROLO GREEN/RED)
CREATE TABLE IF NOT EXISTS mensalidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jogador_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
    mes TEXT NOT NULL, 
    pago BOOLEAN DEFAULT FALSE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    valor_pago DECIMAL(10, 2) DEFAULT 20.00,
    UNIQUE(jogador_id, mes)
);

-- 3. VISTA PARA RESUMO DA BANCA ATUAL
-- Esta vista calcula o total da banca master somando tudo o que entrou e saiu.
CREATE OR REPLACE VIEW vista_banca_master AS
SELECT 
    COALESCE(SUM(valor), 0) as banca_total,
    COUNT(*) as total_movimentos,
    MAX(data_movimento) as ultimo_movimento
FROM banca_transacoes;
