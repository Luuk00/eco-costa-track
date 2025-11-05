-- FASE 1: Corrigir RLS da tabela CUSTOS
-- Remover policy atual que permite INSERT com empresa_id NULL
DROP POLICY IF EXISTS "Usuário vê e gerencia custos da sua empresa" ON custos;

-- Criar policies granulares por operação
CREATE POLICY "Usuário vê custos da sua empresa"
ON custos FOR SELECT
USING ((empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (empresa_id IS NULL));

CREATE POLICY "Usuário cria custos na sua empresa"
ON custos FOR INSERT
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário atualiza custos da sua empresa"
ON custos FOR UPDATE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário deleta custos da sua empresa"
ON custos FOR DELETE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- FASE 1: Corrigir RLS da tabela OBRAS
DROP POLICY IF EXISTS "Usuário vê e gerencia obras da sua empresa" ON obras;

CREATE POLICY "Usuário vê obras da sua empresa"
ON obras FOR SELECT
USING ((empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (empresa_id IS NULL));

CREATE POLICY "Usuário cria obras na sua empresa"
ON obras FOR INSERT
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário atualiza obras da sua empresa"
ON obras FOR UPDATE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário deleta obras da sua empresa"
ON obras FOR DELETE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- FASE 1: Corrigir RLS da tabela GASTOS
DROP POLICY IF EXISTS "Usuário vê e gerencia gastos da sua empresa" ON gastos;

CREATE POLICY "Usuário vê gastos da sua empresa"
ON gastos FOR SELECT
USING ((empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (empresa_id IS NULL));

CREATE POLICY "Usuário cria gastos na sua empresa"
ON gastos FOR INSERT
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário atualiza gastos da sua empresa"
ON gastos FOR UPDATE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Usuário deleta gastos da sua empresa"
ON gastos FOR DELETE
USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- FASE 2: Limpar dados órfãos - Associar custos órfãos à empresa correta
-- Associar custos órfãos baseado na obra_id
UPDATE custos 
SET empresa_id = obras.empresa_id
FROM obras
WHERE custos.empresa_id IS NULL 
  AND custos.obra_id = obras.id
  AND obras.empresa_id IS NOT NULL;

-- Associar custos órfãos baseado no gasto_id
UPDATE custos 
SET empresa_id = gastos.empresa_id
FROM gastos
WHERE custos.empresa_id IS NULL 
  AND custos.gasto_id = gastos.id
  AND gastos.empresa_id IS NOT NULL;

-- Deletar custos que não puderam ser associados (sem obra nem gasto)
DELETE FROM custos 
WHERE empresa_id IS NULL;