-- FASE 1: Limpar Dados Duplicados/Triplicados

-- 1. Remover todos os dados duplicados da empresa da Leticia
DELETE FROM custos WHERE empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM obras WHERE empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM gastos WHERE empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM fornecedores WHERE empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 2. Copiar obras (uma única vez)
INSERT INTO obras (nome, status, orcamento_total, observacao, empresa_id, created_at, updated_at)
SELECT nome, status, orcamento_total, observacao, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', created_at, updated_at
FROM obras
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 3. Copiar gastos (uma única vez)
INSERT INTO gastos (nome, cliente, data_inicio, data_fim, status, empresa_id, created_at, updated_at)
SELECT nome, cliente, data_inicio, data_fim, status, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', created_at, updated_at
FROM gastos
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 4. Copiar fornecedores (uma única vez) se houver
INSERT INTO fornecedores (nome, cnpj_cpf, contato, email, telefone, empresa_id, created_at, updated_at)
SELECT nome, cnpj_cpf, contato, email, telefone, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', created_at, updated_at
FROM fornecedores
WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- 5. Criar mapeamentos temporários para custos
CREATE TEMP TABLE obra_map AS
SELECT o_old.id as old_id, o_new.id as new_id
FROM obras o_old
JOIN obras o_new ON o_old.nome = o_new.nome 
  AND o_old.created_at = o_new.created_at
WHERE o_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND o_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

CREATE TEMP TABLE gasto_map AS
SELECT g_old.id as old_id, g_new.id as new_id
FROM gastos g_old
JOIN gastos g_new ON g_old.nome = g_new.nome 
  AND g_old.created_at = g_new.created_at
WHERE g_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND g_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

CREATE TEMP TABLE fornecedor_map AS
SELECT f_old.id as old_id, f_new.id as new_id
FROM fornecedores f_old
JOIN fornecedores f_new ON f_old.nome = f_new.nome 
  AND f_old.created_at = f_new.created_at
WHERE f_old.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND f_new.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 6. Copiar custos com mapeamento correto
INSERT INTO custos (
  data, descricao, tipo_operacao, documento, codigo_operacao, 
  receptor_destinatario, observacao, tipo_transacao, valor,
  obra_id, gasto_id, fornecedor_id, empresa_id,
  comprovante_url, status_aprovacao, created_at, updated_at
)
SELECT 
  c.data, c.descricao, c.tipo_operacao, c.documento, c.codigo_operacao,
  c.receptor_destinatario, c.observacao, c.tipo_transacao, c.valor,
  om.new_id as obra_id,
  gm.new_id as gasto_id,
  fm.new_id as fornecedor_id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' as empresa_id,
  c.comprovante_url, c.status_aprovacao, c.created_at, c.updated_at
FROM custos c
LEFT JOIN obra_map om ON c.obra_id = om.old_id
LEFT JOIN gasto_map gm ON c.gasto_id = gm.old_id
LEFT JOIN fornecedor_map fm ON c.fornecedor_id = fm.old_id
WHERE c.empresa_id = '00000000-0000-0000-0000-000000000001';

-- 7. Limpar tabelas temporárias
DROP TABLE IF EXISTS obra_map;
DROP TABLE IF EXISTS gasto_map;
DROP TABLE IF EXISTS fornecedor_map;