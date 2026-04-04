-- ==========================================
-- ABRIR COFRE DE FOTOS (STORAGE BUCKET)
-- ==========================================

-- 1. CRIAR O BUCKET 'fotos' (SE NÃO EXISTIR)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICA: PERMITIR QUE QUALQUER PESSOA VEJA AS FOTOS
CREATE POLICY "Fotos Publicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'fotos' );

-- 3. POLÍTICA: PERMITIR UPLOADS (PARA A TUA APP)
CREATE POLICY "Upload de Fotos Elite"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'fotos' );

-- 4. POLÍTICA: PERMITIR ATUALIZAR/APAGAR (OPCIONAL)
CREATE POLICY "Gestao de Fotos Elite"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'fotos' );
