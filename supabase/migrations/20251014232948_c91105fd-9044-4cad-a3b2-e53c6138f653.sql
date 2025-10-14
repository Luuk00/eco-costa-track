-- =====================================================
-- PARTE 2: ATRIBUIR ROLES E ATUALIZAR RLS (CORRIGIDO)
-- =====================================================

-- 2.1 Atribuir super_admin ao lukasmoura
UPDATE user_roles 
SET role = 'super_admin' 
WHERE user_id = '3af2badd-c8a5-4681-be6d-aa7c95c8b0da';

-- 2.2 Criar role colaborador para Leticia (sem ON CONFLICT)
-- Primeiro deletar se existir
DELETE FROM user_roles WHERE user_id = 'db0cf554-f32e-4ce5-8c99-4d200d119c39';
-- Depois inserir
INSERT INTO user_roles (user_id, role)
VALUES ('db0cf554-f32e-4ce5-8c99-4d200d119c39', 'colaborador');

-- 2.3 Atualizar todas as políticas RLS para reconhecer super_admin

-- Tabela: profiles
DROP POLICY IF EXISTS "Admin gerencia todos perfis" ON profiles;
DROP POLICY IF EXISTS "Super admin e admin gerenciam todos perfis" ON profiles;
CREATE POLICY "Super admin e admin gerenciam todos perfis"
  ON profiles FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: obras
DROP POLICY IF EXISTS "Admin vê todas obras" ON obras;
DROP POLICY IF EXISTS "Super admin e admin veem todas obras" ON obras;
CREATE POLICY "Super admin e admin veem todas obras"
  ON obras FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: gastos
DROP POLICY IF EXISTS "Admin vê todos gastos" ON gastos;
DROP POLICY IF EXISTS "Super admin e admin veem todos gastos" ON gastos;
CREATE POLICY "Super admin e admin veem todos gastos"
  ON gastos FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: custos
DROP POLICY IF EXISTS "Admin vê todos custos" ON custos;
DROP POLICY IF EXISTS "Super admin e admin veem todos custos" ON custos;
CREATE POLICY "Super admin e admin veem todos custos"
  ON custos FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: fornecedores
DROP POLICY IF EXISTS "Admin vê todos fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Super admin e admin veem todos fornecedores" ON fornecedores;
CREATE POLICY "Super admin e admin veem todos fornecedores"
  ON fornecedores FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: empresas
DROP POLICY IF EXISTS "Admin gerencia todas empresas" ON empresas;
DROP POLICY IF EXISTS "Super admin e admin gerenciam todas empresas" ON empresas;
CREATE POLICY "Super admin e admin gerenciam todas empresas"
  ON empresas FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: subscriptions
DROP POLICY IF EXISTS "Admin vê todas subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Super admin e admin veem todas subscriptions" ON subscriptions;
CREATE POLICY "Super admin e admin veem todas subscriptions"
  ON subscriptions FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- Tabela: user_roles
DROP POLICY IF EXISTS "Admin gerencia roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin e admin gerenciam roles" ON user_roles;
CREATE POLICY "Super admin e admin gerenciam roles"
  ON user_roles FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- PARTE 3: COPIAR TODOS OS DADOS PARA LETICIA
-- =====================================================

-- 3.1 Copiar todas as OBRAS
INSERT INTO obras (nome, status, orcamento_total, observacao, empresa_id, created_at, updated_at)
SELECT 
  nome, 
  status, 
  orcamento_total, 
  observacao, 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as empresa_id,
  created_at,
  NOW() as updated_at
FROM obras
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 3.2 Copiar todos os GASTOS/PROJETOS
INSERT INTO gastos (nome, cliente, data_inicio, data_fim, status, empresa_id, created_at, updated_at)
SELECT 
  nome, 
  cliente, 
  data_inicio, 
  data_fim, 
  status, 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as empresa_id,
  created_at,
  NOW() as updated_at
FROM gastos
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 3.3 Copiar todos os FORNECEDORES (se houver)
INSERT INTO fornecedores (nome, cnpj_cpf, contato, email, telefone, empresa_id, created_at, updated_at)
SELECT 
  nome, 
  cnpj_cpf, 
  contato, 
  email, 
  telefone, 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as empresa_id,
  created_at,
  NOW() as updated_at
FROM fornecedores
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 3.4 Copiar CUSTOS com mapeamento correto de IDs

-- Criar tabela temporária de mapeamento de obras
CREATE TEMP TABLE obra_map AS
SELECT 
  o_old.id as old_id,
  o_new.id as new_id
FROM obras o_old
JOIN obras o_new ON o_old.nome = o_new.nome AND o_old.status = o_new.status
WHERE o_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND o_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Criar tabela temporária de mapeamento de gastos
CREATE TEMP TABLE gasto_map AS
SELECT 
  g_old.id as old_id,
  g_new.id as new_id
FROM gastos g_old
JOIN gastos g_new ON g_old.nome = g_new.nome AND g_old.cliente = g_new.cliente
WHERE g_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND g_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Criar tabela temporária de mapeamento de fornecedores (se houver)
CREATE TEMP TABLE fornecedor_map AS
SELECT 
  f_old.id as old_id,
  f_new.id as new_id
FROM fornecedores f_old
JOIN fornecedores f_new ON f_old.nome = f_new.nome
WHERE f_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND f_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Inserir custos com IDs mapeados
INSERT INTO custos (
  descricao, 
  valor, 
  data, 
  tipo_transacao, 
  status_aprovacao, 
  observacao,
  documento,
  tipo_operacao,
  codigo_operacao,
  receptor_destinatario,
  obra_id, 
  gasto_id, 
  fornecedor_id,
  empresa_id,
  created_at,
  updated_at,
  comprovante_url,
  aprovado_por,
  aprovado_em
)
SELECT 
  c.descricao,
  c.valor,
  c.data,
  c.tipo_transacao,
  c.status_aprovacao,
  c.observacao,
  c.documento,
  c.tipo_operacao,
  c.codigo_operacao,
  c.receptor_destinatario,
  COALESCE(om.new_id, c.obra_id) as obra_id,
  COALESCE(gm.new_id, c.gasto_id) as gasto_id,
  COALESCE(fm.new_id, c.fornecedor_id) as fornecedor_id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as empresa_id,
  c.created_at,
  NOW() as updated_at,
  c.comprovante_url,
  c.aprovado_por,
  c.aprovado_em
FROM custos c
LEFT JOIN obra_map om ON c.obra_id = om.old_id
LEFT JOIN gasto_map gm ON c.gasto_id = gm.old_id
LEFT JOIN fornecedor_map fm ON c.fornecedor_id = fm.old_id
WHERE c.empresa_id = '00000000-0000-0000-0000-000000000001';