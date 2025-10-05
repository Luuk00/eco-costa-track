-- Adicionar coluna observacao na tabela custos
ALTER TABLE public.custos
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Renomear a coluna nome para receptor_destinatario para melhor clareza
ALTER TABLE public.custos
RENAME COLUMN nome TO receptor_destinatario;