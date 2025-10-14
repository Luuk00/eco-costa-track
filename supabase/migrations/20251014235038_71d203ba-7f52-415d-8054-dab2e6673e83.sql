-- Limpar dados duplicados do lukasmoura (empresa 00000000-0000-0000-0000-000000000001)

-- 1. Criar tabela temporária com obras únicas (manter a mais antiga de cada grupo)
CREATE TEMP TABLE obras_to_keep AS
SELECT DISTINCT ON (nome, observacao, COALESCE(orcamento_total, 0)) 
  id, nome, observacao, orcamento_total, created_at
FROM obras
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
ORDER BY nome, observacao, COALESCE(orcamento_total, 0), created_at ASC;

-- 2. Criar tabela temporária com gastos únicos
CREATE TEMP TABLE gastos_to_keep AS
SELECT DISTINCT ON (nome, cliente, data_inicio) 
  id, nome, cliente, data_inicio, created_at
FROM gastos
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
ORDER BY nome, cliente, data_inicio, created_at ASC;

-- 3. Criar mapeamento de obras antigas para obras mantidas
CREATE TEMP TABLE obra_id_map AS
SELECT 
  o.id as old_id,
  (SELECT otk.id 
   FROM obras_to_keep otk
   WHERE otk.nome = o.nome 
     AND otk.observacao = o.observacao
     AND COALESCE(otk.orcamento_total, 0) = COALESCE(o.orcamento_total, 0)
   LIMIT 1
  ) as new_id
FROM obras o
WHERE o.empresa_id = '00000000-0000-0000-0000-000000000001';

-- 4. Criar mapeamento de gastos antigos para gastos mantidos
CREATE TEMP TABLE gasto_id_map AS
SELECT 
  g.id as old_id,
  (SELECT gtk.id 
   FROM gastos_to_keep gtk
   WHERE gtk.nome = g.nome 
     AND gtk.cliente = g.cliente
     AND gtk.data_inicio = g.data_inicio
   LIMIT 1
  ) as new_id
FROM gastos g
WHERE g.empresa_id = '00000000-0000-0000-0000-000000000001';

-- 5. Atualizar referências de obra_id nos custos
UPDATE custos c
SET obra_id = oim.new_id
FROM obra_id_map oim
WHERE c.obra_id = oim.old_id
  AND c.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND oim.new_id IS NOT NULL;

-- 6. Atualizar referências de gasto_id nos custos
UPDATE custos c
SET gasto_id = gim.new_id
FROM gasto_id_map gim
WHERE c.gasto_id = gim.old_id
  AND c.empresa_id = '00000000-0000-0000-0000-000000000001'
  AND gim.new_id IS NOT NULL;

-- 7. Deletar custos duplicados (manter único por data, descricao, valor, obra_id, gasto_id)
DELETE FROM custos c
WHERE c.empresa_id = '00000000-0000-0000-0000-000000000001'
AND c.id NOT IN (
  SELECT DISTINCT ON (data, COALESCE(descricao, ''), valor, obra_id, gasto_id) id
  FROM custos
  WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
  ORDER BY data, COALESCE(descricao, ''), valor, obra_id, gasto_id, created_at ASC
);

-- 8. Deletar obras duplicadas (manter apenas as da tabela obras_to_keep)
DELETE FROM obras
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
AND id NOT IN (SELECT id FROM obras_to_keep);

-- 9. Deletar gastos duplicados (manter apenas os da tabela gastos_to_keep)
DELETE FROM gastos
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
AND id NOT IN (SELECT id FROM gastos_to_keep);

-- 10. Limpar tabelas temporárias
DROP TABLE IF EXISTS obras_to_keep;
DROP TABLE IF EXISTS gastos_to_keep;
DROP TABLE IF EXISTS obra_id_map;
DROP TABLE IF EXISTS gasto_id_map;