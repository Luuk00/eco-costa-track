-- FASE 0: PREPARAÇÃO DO BANCO DE DADOS PARA SAAS

-- 1. Criar tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC,
  currency TEXT DEFAULT 'BRL',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, empresa_id)
);

-- 3. Adicionar nome_personalizado na tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nome_personalizado TEXT;

-- 4. RLS para user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem próprias preferências" ON user_preferences;
CREATE POLICY "Usuários veem próprias preferências"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários atualizam próprias preferências" ON user_preferences;
CREATE POLICY "Usuários atualizam próprias preferências"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários criam próprias preferências" ON user_preferences;
CREATE POLICY "Usuários criam próprias preferências"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem próprias subscriptions" ON subscriptions;
CREATE POLICY "Usuários veem próprias subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin vê todas subscriptions" ON subscriptions;
CREATE POLICY "Admin vê todas subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- 6. Criar nova empresa para Leticia (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM empresas WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') THEN
    INSERT INTO empresas (id, nome, cnpj, nome_personalizado)
    VALUES (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'MAP AMBIENTAL - Leticia',
      '00.000.000/0001-01',
      'MAP AMBIENTAL'
    );
  END IF;
END $$;

-- 7. Copiar obras para empresa da Leticia
INSERT INTO obras (nome, status, orcamento_total, observacao, empresa_id, created_at, updated_at)
SELECT nome, status, orcamento_total, observacao, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', created_at, updated_at
FROM obras
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
AND NOT EXISTS (
  SELECT 1 FROM obras o2 
  WHERE o2.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
  AND o2.nome = obras.nome
);

-- 8. Copiar gastos para empresa da Leticia
INSERT INTO gastos (nome, cliente, data_inicio, data_fim, status, empresa_id, created_at, updated_at)
SELECT nome, cliente, data_inicio, data_fim, status, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', created_at, updated_at
FROM gastos
WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
AND NOT EXISTS (
  SELECT 1 FROM gastos g2 
  WHERE g2.empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
  AND g2.nome = gastos.nome
);

-- 9. Associar Leticia à nova empresa
UPDATE profiles
SET empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
WHERE id = 'db0cf554-f32e-4ce5-8c99-4d200d119c39';

-- 10. Criar subscription trial de 7 dias para Leticia (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = 'db0cf554-f32e-4ce5-8c99-4d200d119c39' 
    AND empresa_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ) THEN
    INSERT INTO subscriptions (user_id, empresa_id, plan_type, status, trial_ends_at)
    VALUES (
      'db0cf554-f32e-4ce5-8c99-4d200d119c39',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'trial',
      'active',
      NOW() + INTERVAL '7 days'
    );
  END IF;
END $$;

-- 11. Criar preferências padrão para Leticia (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = 'db0cf554-f32e-4ce5-8c99-4d200d119c39') THEN
    INSERT INTO user_preferences (user_id, language)
    VALUES ('db0cf554-f32e-4ce5-8c99-4d200d119c39', 'pt-BR');
  END IF;
END $$;

-- 12. Atualizar empresa do lukasmoura
UPDATE empresas
SET nome = 'FINANTRACKER - Testes Internos',
    nome_personalizado = 'Testes Lukasmoura'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 13. Criar subscription permanente para lukasmoura (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = '3af2badd-c8a5-4681-be6d-aa7c95c8b0da' 
    AND empresa_id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    INSERT INTO subscriptions (user_id, empresa_id, plan_type, status, subscription_ends_at)
    VALUES (
      '3af2badd-c8a5-4681-be6d-aa7c95c8b0da',
      '00000000-0000-0000-0000-000000000001',
      'annual',
      'active',
      NOW() + INTERVAL '100 years'
    );
  END IF;
END $$;

-- 14. Criar preferências para lukasmoura (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = '3af2badd-c8a5-4681-be6d-aa7c95c8b0da') THEN
    INSERT INTO user_preferences (user_id, language)
    VALUES ('3af2badd-c8a5-4681-be6d-aa7c95c8b0da', 'pt-BR');
  END IF;
END $$;

-- 15. Atualizar RLS policies - obras
DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar obras" ON obras;
DROP POLICY IF EXISTS "Usuário vê obras da sua empresa" ON obras;
DROP POLICY IF EXISTS "Admin vê todas obras" ON obras;
DROP POLICY IF EXISTS "Usuário vê e gerencia obras da sua empresa" ON obras;

CREATE POLICY "Admin vê todas obras"
  ON obras FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Usuário vê e gerencia obras da sua empresa"
  ON obras FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    ) OR empresa_id IS NULL
  );

-- 16. Atualizar RLS policies - gastos
DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar gastos" ON gastos;
DROP POLICY IF EXISTS "Usuário vê gastos da sua empresa" ON gastos;
DROP POLICY IF EXISTS "Admin vê todos gastos" ON gastos;
DROP POLICY IF EXISTS "Usuário vê e gerencia gastos da sua empresa" ON gastos;

CREATE POLICY "Admin vê todos gastos"
  ON gastos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Usuário vê e gerencia gastos da sua empresa"
  ON gastos FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    ) OR empresa_id IS NULL
  );

-- 17. Atualizar RLS policies - custos
DROP POLICY IF EXISTS "Admin e financeiro podem criar custos" ON custos;
DROP POLICY IF EXISTS "Admin e financeiro podem editar custos" ON custos;
DROP POLICY IF EXISTS "Admin pode deletar custos" ON custos;
DROP POLICY IF EXISTS "Usuário vê custos da sua empresa" ON custos;
DROP POLICY IF EXISTS "Admin vê todos custos" ON custos;
DROP POLICY IF EXISTS "Usuário vê e gerencia custos da sua empresa" ON custos;

CREATE POLICY "Admin vê todos custos"
  ON custos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Usuário vê e gerencia custos da sua empresa"
  ON custos FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    ) OR empresa_id IS NULL
  );

-- 18. Atualizar RLS policies - fornecedores
DROP POLICY IF EXISTS "Admin e financeiro podem gerenciar fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Usuário vê fornecedores da sua empresa" ON fornecedores;
DROP POLICY IF EXISTS "Admin vê todos fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Usuário vê e gerencia fornecedores da sua empresa" ON fornecedores;

CREATE POLICY "Admin vê todos fornecedores"
  ON fornecedores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Usuário vê e gerencia fornecedores da sua empresa"
  ON fornecedores FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 19. Atualizar RLS policies - profiles
DROP POLICY IF EXISTS "Admin pode gerenciar perfis" ON profiles;
DROP POLICY IF EXISTS "Admin vê todos perfis" ON profiles;
DROP POLICY IF EXISTS "Admin gerencia todos perfis" ON profiles;
DROP POLICY IF EXISTS "Admin gerencia perfis" ON profiles;

CREATE POLICY "Admin gerencia todos perfis"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- 20. Atualizar RLS policies - empresas
DROP POLICY IF EXISTS "Admin pode gerenciar empresas" ON empresas;
DROP POLICY IF EXISTS "Admin pode ver todas empresas" ON empresas;
DROP POLICY IF EXISTS "Admin gerencia todas empresas" ON empresas;
DROP POLICY IF EXISTS "Admin gerencia empresas" ON empresas;

CREATE POLICY "Admin gerencia todas empresas"
  ON empresas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );