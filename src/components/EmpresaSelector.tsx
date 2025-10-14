import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function EmpresaSelector() {
  const { empresaAtiva, setEmpresaAtiva, profile } = useAuth();
  const { isAdmin } = usePermission();

  const { data: empresas } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      let query = supabase.from("empresas").select("*").order("nome");
      
      if (!isAdmin() && profile?.empresa_id) {
        query = query.eq("id", profile.empresa_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  if (!empresas || empresas.length === 0) return null;
  if (!isAdmin() && empresas.length === 1) return null;

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={empresaAtiva || ""} onValueChange={setEmpresaAtiva}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="Selecione a empresa" />
        </SelectTrigger>
        <SelectContent>
          {empresas?.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.id}>
              {empresa.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
