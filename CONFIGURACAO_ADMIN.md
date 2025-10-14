# Configuração do Usuário Administrador

## 📋 Passos para configurar lukasmoura@hotmail.com como Admin

### 1️⃣ Fazer Signup na Aplicação

1. Acesse a rota `/auth` na aplicação
2. Clique na aba **"Cadastrar"**
3. Preencha o formulário:
   - **Email:** `lukasmoura@hotmail.com`
   - **Senha:** (escolha uma senha segura)
   - **Nome:** Lukas Moura
4. Clique em **"Cadastrar"**

---

### 2️⃣ Executar SQL no Supabase

Após o cadastro, você precisa executar os comandos SQL abaixo no **SQL Editor** do Supabase:

🔗 **Link direto:** https://supabase.com/dashboard/project/delgbpqcbmxtvvvgsnmr/sql/new

---

#### 2.1 Buscar o UUID do seu usuário

```sql
SELECT id, email FROM auth.users WHERE email = 'lukasmoura@hotmail.com';
```

📝 **Copie o `id` (UUID) retornado.** Você vai precisar dele nos próximos comandos.

---

#### 2.2 Atribuir a role 'admin'

Substitua `<SEU_UUID>` pelo UUID copiado no passo anterior:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_UUID>', 'admin');
```

**Exemplo completo:**
```sql
-- Substitua o UUID pelo seu
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin');
```

---

#### 2.3 Associar à empresa principal

**Primeiro, busque o ID da empresa principal:**

```sql
SELECT id, nome FROM public.empresas ORDER BY created_at LIMIT 1;
```

📝 **Copie o `id` da empresa principal.** Depois execute:

```sql
UPDATE public.profiles
SET empresa_id = '<ID_DA_EMPRESA>'
WHERE email = 'lukasmoura@hotmail.com';
```

**Exemplo completo:**
```sql
-- Substitua o ID da empresa pelo ID retornado acima
UPDATE public.profiles
SET empresa_id = '12345678-1234-1234-1234-123456789012'
WHERE email = 'lukasmoura@hotmail.com';
```

---

#### 2.4 (OPCIONAL) Atualizar o nome se necessário

Caso o nome não tenha sido salvo corretamente durante o cadastro:

```sql
UPDATE public.profiles
SET nome = 'Lukas Moura'
WHERE email = 'lukasmoura@hotmail.com';
```

---

### 3️⃣ Fazer Logout e Login Novamente

1. Faça **logout** da aplicação (clique no menu do usuário > Sair)
2. Faça **login** novamente com `lukasmoura@hotmail.com`
3. Agora você terá acesso completo como **Administrador**

---

## ✅ Funcionalidades Disponíveis como Admin

Como admin (`lukasmoura@hotmail.com`), você terá acesso completo a:

### 📊 **Dashboard**
- Gráficos de despesas por mês
- Custos por categoria
- Lucro líquido por obra
- Top 5 fornecedores
- Alertas de orçamento ultrapassado
- Alertas de custos pendentes de aprovação

### 💰 **Centrais de Custos (Gastos)**
- ✅ Criar, editar, excluir e visualizar centrais
- ✅ Controle de status (Em Andamento, Concluído)
- ✅ Filtros por empresa

### 💸 **Custos**
- ✅ CRUD completo de custos
- ✅ Aprovar/rejeitar custos pendentes
- ✅ Upload de comprovantes
- ✅ Vinculação com obras e fornecedores

### 🏗️ **Obras/Projetos**
- ✅ CRUD completo
- ✅ Controle de orçamento
- ✅ Visualização de percentual gasto
- ✅ Alertas de orçamento ultrapassado

### 🏢 **Fornecedores**
- ✅ CRUD completo
- ✅ Cadastro com CNPJ/CPF, telefone, email

### 🏭 **Empresas** (somente admin)
- ✅ CRUD completo de empresas
- ✅ Controle de CNPJ
- ✅ Gerenciamento multiempresa

### 👥 **Usuários** (somente admin)
- ✅ Visualizar todos os usuários
- ✅ Editar nome, empresa e função (role)
- ✅ Atribuir roles: Administrador, Financeiro, Colaborador
- ✅ Buscar usuários por nome ou email
- ✅ Badges visuais por função

### ✅ **Aprovações**
- ✅ Aprovar/rejeitar custos pendentes
- ✅ Histórico de aprovações

### 📥 **Importar CSV**
- ✅ Importação de extratos bancários (Banco do Brasil)
- ✅ Vinculação automática à empresa ativa
- ✅ Preview antes de importar

---

## 🔍 Verificar Permissões

Para verificar se as permissões foram aplicadas corretamente, execute no SQL Editor:

```sql
SELECT 
  p.id,
  p.email,
  p.nome,
  e.nome as empresa,
  ur.role
FROM public.profiles p
LEFT JOIN public.empresas e ON p.empresa_id = e.id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email = 'lukasmoura@hotmail.com';
```

✅ **O resultado esperado:**
- **email:** lukasmoura@hotmail.com
- **nome:** Lukas Moura
- **role:** admin
- **empresa:** (nome da empresa principal)

---

## 🔗 Links Úteis

- 🗄️ **SQL Editor:** https://supabase.com/dashboard/project/delgbpqcbmxtvvvgsnmr/sql/new
- 👤 **Gerenciar Usuários (Supabase):** https://supabase.com/dashboard/project/delgbpqcbmxtvvvgsnmr/auth/users
- 🔑 **Auth Providers:** https://supabase.com/dashboard/project/delgbpqcbmxtvvvgsnmr/auth/providers

---

## ⚠️ Observações Importantes

### Segurança
- 🔒 **Nunca** compartilhe o UUID ou SQL diretamente com usuários não autorizados
- 🔐 As roles são armazenadas em uma tabela separada (`user_roles`) para evitar escalação de privilégios
- 🛡️ Todas as permissões são validadas via RLS (Row Level Security) no Supabase

### Processo
- ⚠️ **Execute os comandos SQL APÓS fazer o cadastro na aplicação**
- ✅ **Faça logout e login novamente** após atribuir a role admin
- 📧 Se o email não for confirmado, verifique a caixa de spam

### Hierarquia de Permissões
1. **Admin** → Acesso total (empresas, usuários, todas as funcionalidades)
2. **Financeiro** → Gerenciar custos, obras, fornecedores, aprovar custos, importar CSV
3. **Colaborador** → Visualizar dados da própria empresa

---

## 🆘 Solução de Problemas

### Problema: "Acesso Negado" ao tentar acessar páginas de admin

**Solução:**
1. Faça logout
2. Verifique se a role foi inserida corretamente:
   ```sql
   SELECT * FROM public.user_roles WHERE user_id = '<SEU_UUID>';
   ```
3. Faça login novamente

---

### Problema: Empresa não aparece no dashboard

**Solução:**
1. Verifique se a empresa foi associada ao perfil:
   ```sql
   SELECT empresa_id FROM public.profiles WHERE email = 'lukasmoura@hotmail.com';
   ```
2. Se estiver NULL, execute o comando 2.3 novamente

---

### Problema: Não consigo editar usuários

**Solução:**
1. Confirme que você é admin:
   ```sql
   SELECT role FROM public.user_roles WHERE user_id = (
     SELECT id FROM public.profiles WHERE email = 'lukasmoura@hotmail.com'
   );
   ```
2. Deve retornar `'admin'`

---

## 📝 Comandos SQL Completos (Copy-Paste)

Após fazer o signup, execute estes comandos **em ordem**:

```sql
-- 1. Buscar seu UUID
SELECT id, email FROM auth.users WHERE email = 'lukasmoura@hotmail.com';

-- 2. Atribuir role admin (substitua <SEU_UUID>)
INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_UUID>', 'admin');

-- 3. Buscar ID da empresa principal
SELECT id, nome FROM public.empresas ORDER BY created_at LIMIT 1;

-- 4. Associar à empresa (substitua <ID_DA_EMPRESA>)
UPDATE public.profiles
SET empresa_id = '<ID_DA_EMPRESA>'
WHERE email = 'lukasmoura@hotmail.com';

-- 5. (Opcional) Atualizar nome
UPDATE public.profiles
SET nome = 'Lukas Moura'
WHERE email = 'lukasmoura@hotmail.com';

-- 6. Verificar tudo
SELECT 
  p.id,
  p.email,
  p.nome,
  e.nome as empresa,
  ur.role
FROM public.profiles p
LEFT JOIN public.empresas e ON p.empresa_id = e.id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email = 'lukasmoura@hotmail.com';
```

---

✅ **Pronto! Após seguir esses passos, você terá controle total como administrador do sistema.**
