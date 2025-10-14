-- ============================================
-- MIGRATION: Sistema Multiempresa + Autenticação
-- ============================================

-- 1. TABELA DE EMPRESAS
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENUM DE PERMISSÕES
CREATE TYPE public.app_role AS ENUM ('admin', 'financeiro', 'colaborador');

-- 4. TABELA DE ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- 5. TABELA DE FORNECEDORES
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj_cpf TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ADICIONAR COLUNAS ÀS TABELAS EXISTENTES (PRESERVANDO DADOS)
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS orcamento_total NUMERIC;

ALTER TABLE public.gastos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS status_aprovacao TEXT DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado'));
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- 7. FUNÇÕES DE SEGURANÇA
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 8. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER empresas_updated_at BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER fornecedores_updated_at BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. HABILITAR RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS RLS - EMPRESAS
DROP POLICY IF EXISTS "Admin pode ver todas empresas" ON public.empresas;
CREATE POLICY "Admin pode ver todas empresas" ON public.empresas
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuário vê sua empresa" ON public.empresas;
CREATE POLICY "Usuário vê sua empresa" ON public.empresas
  FOR SELECT USING (
    id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin pode gerenciar empresas" ON public.empresas;
CREATE POLICY "Admin pode gerenciar empresas" ON public.empresas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 12. POLÍTICAS RLS - PROFILES
DROP POLICY IF EXISTS "Usuário vê próprio perfil" ON public.profiles;
CREATE POLICY "Usuário vê próprio perfil" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin vê todos perfis" ON public.profiles;
CREATE POLICY "Admin vê todos perfis" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin pode gerenciar perfis" ON public.profiles;
CREATE POLICY "Admin pode gerenciar perfis" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 13. POLÍTICAS RLS - USER_ROLES
DROP POLICY IF EXISTS "Admin gerencia roles" ON public.user_roles;
CREATE POLICY "Admin gerencia roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuários veem próprias roles" ON public.user_roles;
CREATE POLICY "Usuários veem próprias roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- 14. POLÍTICAS RLS - OBRAS (ATUALIZAR EXISTENTES)
DROP POLICY IF EXISTS "Permitir acesso total a obras" ON public.obras;

DROP POLICY IF EXISTS "Usuário vê obras da sua empresa" ON public.obras;
CREATE POLICY "Usuário vê obras da sua empresa" ON public.obras
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    OR empresa_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar obras" ON public.obras;
CREATE POLICY "Admin e financeiro podem gerenciar obras" ON public.obras
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

-- 15. POLÍTICAS RLS - GASTOS (ATUALIZAR EXISTENTES)
DROP POLICY IF EXISTS "Permitir acesso total a gastos" ON public.gastos;

DROP POLICY IF EXISTS "Usuário vê gastos da sua empresa" ON public.gastos;
CREATE POLICY "Usuário vê gastos da sua empresa" ON public.gastos
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    OR empresa_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar gastos" ON public.gastos;
CREATE POLICY "Admin e financeiro podem gerenciar gastos" ON public.gastos
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

-- 16. POLÍTICAS RLS - CUSTOS (ATUALIZAR EXISTENTES)
DROP POLICY IF EXISTS "Permitir acesso total a custos" ON public.custos;

DROP POLICY IF EXISTS "Usuário vê custos da sua empresa" ON public.custos;
CREATE POLICY "Usuário vê custos da sua empresa" ON public.custos
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    OR empresa_id IS NULL
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admin e financeiro podem criar custos" ON public.custos;
CREATE POLICY "Admin e financeiro podem criar custos" ON public.custos
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

DROP POLICY IF EXISTS "Admin e financeiro podem editar custos" ON public.custos;
CREATE POLICY "Admin e financeiro podem editar custos" ON public.custos
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

DROP POLICY IF EXISTS "Admin pode deletar custos" ON public.custos;
CREATE POLICY "Admin pode deletar custos" ON public.custos
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 17. POLÍTICAS RLS - FORNECEDORES
DROP POLICY IF EXISTS "Usuário vê fornecedores da sua empresa" ON public.fornecedores;
CREATE POLICY "Usuário vê fornecedores da sua empresa" ON public.fornecedores
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar fornecedores" ON public.fornecedores;
CREATE POLICY "Admin e financeiro podem gerenciar fornecedores" ON public.fornecedores
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

-- 18. DADOS INICIAIS
INSERT INTO public.empresas (id, nome, cnpj)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Principal', '00.000.000/0001-00')
ON CONFLICT (id) DO NOTHING;

-- 19. ASSOCIAR DADOS EXISTENTES À EMPRESA PADRÃO
UPDATE public.obras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE public.gastos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE public.custos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- 20. CRIAR BUCKET PARA COMPROVANTES
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- 21. POLÍTICAS DE STORAGE
DROP POLICY IF EXISTS "Admin e financeiro podem fazer upload" ON storage.objects;
CREATE POLICY "Admin e financeiro podem fazer upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comprovantes' AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'financeiro')
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem ver comprovantes" ON storage.objects;
CREATE POLICY "Usuários autenticados podem ver comprovantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Admin e financeiro podem deletar comprovantes" ON storage.objects;
CREATE POLICY "Admin e financeiro podem deletar comprovantes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'comprovantes' AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'financeiro')
    )
  );