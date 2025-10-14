import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { role } = useAuth();
  
  console.log("🔍 usePermission - role atual:", role);

  const hasRole = (requiredRole: string | string[]) => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };

  const isSuperAdmin = () => {
    const result = hasRole("super_admin");
    console.log("🔍 isSuperAdmin:", result);
    return result;
  };
  const isAdmin = () => hasRole(["admin", "super_admin"]);
  const isFinanceiro = () => hasRole(["financeiro", "admin", "super_admin"]);

  return {
    hasRole,
    isSuperAdmin,
    isAdmin,
    isFinanceiro,
    role,
  };
}
