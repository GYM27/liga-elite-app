-- Criação das tabelas para a Missão Jantar (Desafio All-In)

CREATE TABLE IF NOT EXISTS public.missao_campanhas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    mes_referencia TEXT NOT NULL, -- Ex: 'Maio 2026'
    banca_atual NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
    vidas_restantes INTEGER DEFAULT 2 NOT NULL,
    objetivo NUMERIC(10, 2) DEFAULT 500.00 NOT NULL,
    status TEXT DEFAULT 'ATIVA' NOT NULL -- 'ATIVA', 'CONCLUIDA', 'FALHADA'
);

CREATE TABLE IF NOT EXISTS public.missao_propostas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    campanha_id UUID REFERENCES public.missao_campanhas(id) ON DELETE CASCADE NOT NULL,
    jogador_id UUID REFERENCES public.jogadores(id) ON DELETE CASCADE NOT NULL,
    semana INTEGER NOT NULL,
    jogo TEXT NOT NULL,
    mercado TEXT NOT NULL,
    odd NUMERIC(10, 2) NOT NULL,
    oficial BOOLEAN DEFAULT false NOT NULL, -- Define se foi a aposta escolhida pelo admin
    resultado TEXT DEFAULT 'PENDENTE' NOT NULL -- 'PENDENTE', 'GREEN', 'RED', 'VOID'
);

CREATE TABLE IF NOT EXISTS public.missao_votos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    campanha_id UUID REFERENCES public.missao_campanhas(id) ON DELETE CASCADE NOT NULL,
    semana INTEGER NOT NULL,
    jogador_id UUID REFERENCES public.jogadores(id) ON DELETE CASCADE NOT NULL,
    proposta_id UUID REFERENCES public.missao_propostas(id) ON DELETE CASCADE NOT NULL,
    -- Um jogador só pode votar uma vez por semana na mesma campanha
    UNIQUE(campanha_id, semana, jogador_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.missao_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missao_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missao_votos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir leitura total nas campanhas" ON public.missao_campanhas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura total nas propostas" ON public.missao_propostas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura total nos votos" ON public.missao_votos FOR SELECT USING (true);

CREATE POLICY "Permitir inserção e update público nas campanhas" ON public.missao_campanhas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir inserção e update público nas propostas" ON public.missao_propostas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir inserção e update público nos votos" ON public.missao_votos FOR ALL USING (true) WITH CHECK (true);

-- Criar primeira campanha de teste para a época atual
INSERT INTO public.missao_campanhas (mes_referencia, banca_atual, vidas_restantes, objetivo)
VALUES ('Junho 2026', 5.00, 2, 500.00);
