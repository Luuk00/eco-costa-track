-- Alterar tipo do campo data de DATE para TEXT
ALTER TABLE custos ALTER COLUMN data TYPE TEXT USING data::TEXT;

-- Adicionar constraint para validar formato YYYY-MM-DD
ALTER TABLE custos ADD CONSTRAINT custos_data_format CHECK (data ~ '^\d{4}-\d{2}-\d{2}$');