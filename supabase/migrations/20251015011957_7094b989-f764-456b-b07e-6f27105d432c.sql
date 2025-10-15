-- FASE 5: Atualizar assinatura da Leticia para Anual por 1 ano
UPDATE subscriptions
SET 
  plan_type = 'annual',
  subscription_ends_at = NOW() + INTERVAL '365 days',
  started_at = NOW(),
  trial_ends_at = NULL,
  status = 'active',
  updated_at = NOW()
WHERE user_id = 'db0cf554-f32e-4ce5-8c99-4d200d119c39';

-- FASE 4: Adicionar índices para melhorar performance do painel admin
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);