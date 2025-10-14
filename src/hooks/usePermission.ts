import { useAuth } from "@/contexts/AuthContext";

export function usePermission() {
  const { role } = useAuth();

  const hasRole = (requiredRole: string | string[]) => {
    if (!role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };

  const isSuperAdmin = () => hasRole("super_admin");
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
