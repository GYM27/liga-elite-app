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
    valor_pago DECIMAL(10, 2) DEFAULT 5.00,
    UNIQUE(jogador_id, mes)
);

-- 3. [NOVO] TABELA DE PARTIÇÕES DA BANCA (CASA VS BANCO)
CREATE TABLE IF NOT EXISTS banca_particoes (
    id INT PRIMARY KEY DEFAULT 1, 
    casa_valor DECIMAL(12,2) DEFAULT 0, 
    banco_valor DECIMAL(12,2) DEFAULT 0, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERIR SALDO INICIAL (CONFORME PEDIDO)
INSERT INTO banca_particoes (id, casa_valor, banco_valor) 
VALUES (1, 142.30, 271.00) 
ON CONFLICT (id) DO UPDATE SET 
    casa_valor = EXCLUDED.casa_valor, 
    banco_valor = EXCLUDED.banco_valor;

-- 4. [NOVO] HISTÓRICO DE TRANSFERÊNCIAS INTERNAS
CREATE TABLE IF NOT EXISTS banca_transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por TEXT DEFAULT 'ADMIN'
);

-- 5. VISTA PARA RESUMO DA BANCA ATUAL (SOMA DO LEDGER)
CREATE OR REPLACE VIEW vista_banca_master AS
SELECT 
    COALESCE(SUM(valor), 0) as banca_total,
    COUNT(*) as total_movimentos,
    MAX(data_movimento) as ultimo_movimento
FROM banca_transacoes;
