-- Criar tabela de obras
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'em andamento' CHECK (status IN ('em andamento', 'concluída', 'parada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de custos
CREATE TABLE public.custos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  descricao TEXT,
  tipo_operacao TEXT,
  documento TEXT,
  codigo_operacao TEXT,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

-- Políticas para obras (acesso público para MVP - ajustar conforme necessário)
CREATE POLICY "Permitir acesso total a obras"
  ON public.obras
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para custos
CREATE POLICY "Permitir acesso total a custos"
  ON public.custos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custos_updated_at
  BEFORE UPDATE ON public.custos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_custos_obra_id ON public.custos(obra_id);
CREATE INDEX idx_custos_data ON public.custos(data);
CREATE INDEX idx_obras_status ON public.obras(status);