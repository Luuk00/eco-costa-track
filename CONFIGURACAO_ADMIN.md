# Configuração do Usuário Administrador

## Passos para configurar lukasmoura@hotmail.com como Admin

### 1. Fazer Signup na Aplicação

1. Acesse a rota `/auth` na aplicação
2. Clique na aba **"Cadastrar"**
3. Preencha o formulário:
   - **Email:** `lukasmoura@hotmail.com`
   - **Senha:** (escolha uma senha segura)
   - **Nome:** Lukas Moura
4. Clique em **"Cadastrar"**

### 2. Executar SQL no Supabase

Após o cadastro, você precisa executar os comandos SQL abaixo no **SQL Editor** do Supabase:

#### 2.1 Buscar o UUID do seu usuário

```sql
SELECT id, email FROM auth.users WHERE email = 'lukasmoura@hotmail.com';
```

Copie o **id** (UUID) retornado. Você vai precisar dele nos próximos comandos.

---

#### 2.2 Atribuir a role 'admin'

Substitua `<SEU_UUID>` pelo UUID copiado no passo anterior:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<SEU_UUID>', 'admin');
```

**Exemplo:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin');
```

---

#### 2.3 Associar à empresa principal

**Primeiro, busque o ID da empresa principal:**

```sql
SELECT id, nome FROM public.empresas ORDER BY created_at LIMIT 1;
```

Copie o **id** da empresa principal. Depois execute:

```sql
UPDATE public.profiles
SET empresa_id = '<ID_DA_EMPRESA>'
WHERE email = 'lukasmoura@hotmail.com';
```

**Exemplo:**
```sql
UPDATE public.profiles
SET empresa_id = '12345678-1234-1234-1234-123456789012'
WHERE email = 'lukasmoura@hotmail.com';
```

---

### 3. Fazer Logout e Login Novamente

1. Faça **logout** da aplicação
2. Faça **login** novamente com `lukasmoura@hotmail.com`
3. Agora você terá acesso completo a todas as funcionalidades:
   - ✅ **Dashboard** com gráficos e alertas
   - ✅ **Centrais de Custos** (CRUD completo)
   - ✅ **Custos** (CRUD completo + aprovações)
   - ✅ **Obras/Projetos** (CRUD completo)
   - ✅ **Fornecedores** (CRUD completo)
   - ✅ **Empresas** (CRUD completo - somente admin)
   - ✅ **Usuários** (CRUD completo - somente admin)
   - ✅ **Aprovações** (aprovar/rejeitar custos)
   - ✅ **Importar CSV** (importação multiempresa)

---

## Verificar Permissões

Para verificar se as permissões foram aplicadas corretamente, execute:

```sql
SELECT 
  p.email,
  p.nome,
  e.nome as empresa,
  ur.role
FROM public.profiles p
LEFT JOIN public.empresas e ON p.empresa_id = e.id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email = 'lukasmoura@hotmail.com';
```

O resultado deve mostrar:
- **email:** lukasmoura@hotmail.com
- **role:** admin
- **empresa:** nome da empresa principal

---

## Link do SQL Editor do Supabase

🔗 https://supabase.com/dashboard/project/delgbpqcbmxtvvvgsnmr/sql/new

---

## Observações

- ⚠️ **Importante:** Execute os comandos SQL **após** fazer o cadastro na aplicação
- ✅ Após atribuir a role, faça logout e login novamente para que as permissões sejam carregadas
- 🔒 Apenas usuários com role 'admin' podem gerenciar empresas e usuários
- 📊 O dashboard agora exibe alertas de orçamento ultrapassado e custos pendentes
- 📈 4 gráficos foram adicionados ao dashboard: Despesas por Mês, Custos por Categoria, Entradas vs Saídas por Obra, e Top 5 Fornecedores
