-- Renomear coluna cliente para observacao na tabela obras
ALTER TABLE obras RENAME COLUMN cliente TO observacao;

-- Remover colunas data_inicio e data_fim da tabela obras (IRREVERSÍVEL - fazer backup antes se necessário)
ALTER TABLE obras DROP COLUMN data_inicio;
ALTER TABLE obras DROP COLUMN data_fim;