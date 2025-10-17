-- FASE 1: Deletar dados operacionais da empresa do lukasmoura
-- Esta operação é PERMANENTE e IRREVERSÍVEL
DELETE FROM custos WHERE empresa_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM obras WHERE empresa_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM gastos WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- FASE 4: Remover RLS policies que permitem super_admin ver dados de TODAS as empresas
-- Agora super_admin SÓ verá dados da própria empresa_id nas páginas operacionais
DROP POLICY IF EXISTS "Super admin e admin veem todas obras" ON obras;
DROP POLICY IF EXISTS "Super admin e admin veem todos custos" ON custos;  
DROP POLICY IF EXISTS "Super admin e admin veem todos gastos" ON gastos;