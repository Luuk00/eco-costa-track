## Corrigir dados mensais "sumindo" na tela de Custos

### Diagnóstico
- **Nenhum dado foi apagado.** Todos os 1.451 custos continuam no banco (incluindo os 157 de fevereiro).
- Supabase limita queries a **1000 linhas por padrão**. `src/pages/Custos.tsx` busca todos os custos de uma vez e filtra no client → registros mais antigos (Fev/2026 e anteriores) são cortados antes de chegar na tela.

### Solução: mover filtros de data para o servidor + garantir busca completa

Vou aplicar os filtros de **data início/fim** direto na query Supabase (não mais no client). Assim, ao filtrar Fev/2026, o Supabase retorna apenas os 157 registros daquele mês — abaixo do limite de 1000 — e todos aparecem.

Para o caso "sem filtro de data" (ver tudo), adiciono paginação automática para trazer os 1.451 registros em blocos, contornando o limite de 1000.

### Alterações em `src/pages/Custos.tsx`

**1. Incluir `dataInicio` e `dataFim` na `queryKey` e na query server-side:**

```typescript
const { data: custos, isLoading } = useQuery({
  queryKey: ["custos", empresaAtiva, dataInicio, dataFim],
  queryFn: async () => {
    // Filtros de data aplicados no servidor
    if (dataInicio || dataFim) {
      let query = supabase
        .from("custos")
        .select(`*, obras:obra_id(nome), gastos:gasto_id(nome)`);

      if (empresaAtiva) query = query.eq("empresa_id", empresaAtiva);
      if (dataInicio) query = query.gte("data", dataInicio);
      if (dataFim)    query = query.lte("data", dataFim);

      const { data, error } = await query.order("data", { ascending: false });
      if (error) throw error;
      return data;
    }

    // Sem filtro de data: paginar em blocos de 1000 para contornar o limite
    const PAGE_SIZE = 1000;
    let todos: any[] = [];
    let from = 0;
    while (true) {
      let query = supabase
        .from("custos")
        .select(`*, obras:obra_id(nome), gastos:gasto_id(nome)`)
        .order("data", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (empresaAtiva) query = query.eq("empresa_id", empresaAtiva);

      const { data, error } = await query;
      if (error) throw error;
      todos = todos.concat(data || []);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return todos;
  },
});
```

**2. Remover a filtragem client-side de data** (já é feita no servidor):

```typescript
const custosFiltrados = custos?.filter((custo) => {
  if (selectedObra !== "all" && custo.obra_id !== selectedObra) return false;
  if (selectedGasto !== "all" && custo.gasto_id !== selectedGasto) return false;
  if (selectedTipo !== "all" && custo.tipo_operacao !== selectedTipo) return false;
  if (selectedObservacao !== "all" && custo.observacao !== selectedObservacao) return false;
  // ❌ removidas as linhas de dataInicio/dataFim (agora vêm do servidor)
  return true;
}).sort(...) || [];
```

### Resultado esperado
- ✅ Filtrar por Fev/2026 → aparecem os 157 registros
- ✅ Sem filtro → aparecem todos os 1.451 registros (paginação transparente)
- ✅ Barra de busca funciona sobre o conjunto completo
- ✅ Exportar CSV/PDF exporta todos os dados visíveis
- ✅ Nenhum dado é apagado nem alterado no banco

### Observação
Após confirmar que a página Custos funciona, o mesmo padrão (paginação por blocos de 1000) pode ser aplicado ao Dashboard e aos gráficos quando "Todos os períodos" estiver selecionado, caso você note somas incorretas. Posso incluir isso agora se quiser — me avise.