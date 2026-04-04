-- ==========================================
-- ESTRUTURA DE BANCA DE ELITE (AUTOMÁTICA)
-- ==========================================

-- 1. LIMPEZA E INICIALIZAÇÃO (CERTIFICAR QUE SÓ TEMOS AS DUAS PARTIÇÕES)
DELETE FROM banca_particoes;
INSERT INTO banca_particoes (id, nome, valor_vincado) VALUES 
(1, 'CASA', 142.30),  -- Saldo de Jogo inicial
(2, 'BANCO', 271.00); -- Saldo de Quotas inicial

-- 2. FUNÇÃO DE RECONCILIAÇÃO (CONHECIDA NA UI):
-- CASA = VALOR EM 'CASA' (142.30) + SUM(TRANSACAO: PREMIO) - SUM(TRANSACAO: STAKE) + SUM(TRANSF_INTERNO: PARA CASA) - SUM(TRANSF_INTERNO: DE CASA)
-- BANCO = VALOR EM 'BANCO' (271.00) + SUM(TRANSACAO: MENSALIDADE) + SUM(TRANSF_INTERNO: PARA BANCO) - SUM(TRANSF_INTERNO: DE BANCO)

-- NOTA: TODAS AS MENSALIDADES PAGAS JÁ INSEREM UM REGISTO EM 'banca_transacoes'
-- COM TIPO 'MENSALIDADE' E VALOR 5.00.

-- 3. CRIAR VIEW PARA AUDITORIA RÁPIDA (OPCIONAL)
CREATE OR REPLACE VIEW v_banca_resumo AS
SELECT 
    'CASA' AS conta,
    142.30 + COALESCE((SELECT SUM(valor) FROM banca_transacoes WHERE tipo IN ('PREMIO','STAKE','GANHO','PERDIDO') AND jogador_id IS NULL), 0) 
    + COALESCE((SELECT SUM(valor) FROM banca_transferencias WHERE destino = 'CASA'), 0)
    - COALESCE((SELECT SUM(valor) FROM banca_transferencias WHERE origem = 'CASA'), 0) AS saldo_atual
UNION ALL
SELECT 
    'BANCO' AS conta,
    271.00 + COALESCE((SELECT SUM(valor) FROM banca_transacoes WHERE tipo = 'MENSALIDADE'), 0)
    + COALESCE((SELECT SUM(valor) FROM banca_transferencias WHERE destino = 'BANCO'), 0)
    - COALESCE((SELECT SUM(valor) FROM banca_transferencias WHERE origem = 'BANCO'), 0) AS saldo_atual;
