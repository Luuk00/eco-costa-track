-- Criar tabela gastos (espelho de obras)
CREATE TABLE public.gastos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cliente text NOT NULL,
  status text NOT NULL DEFAULT 'em andamento',
  data_inicio date NOT NULL,
  data_fim date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS para gastos
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Policies para gastos (acesso total como em obras)
CREATE POLICY "Permitir acesso total a gastos"
ON public.gastos
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at em gastos
CREATE TRIGGER update_gastos_updated_at
  BEFORE UPDATE ON public.gastos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna gasto_id na tabela custos
ALTER TABLE public.custos 
ADD COLUMN gasto_id uuid REFERENCES public.gastos(id);

-- Adicionar coluna tipo_transacao na tabela custos
ALTER TABLE public.custos 
ADD COLUMN tipo_transacao text CHECK (tipo_transacao IN ('Entrada', 'Saída'));