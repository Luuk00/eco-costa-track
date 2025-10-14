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

  const isAdmin = () => hasRole("admin");
  const isFinanceiro = () => hasRole(["admin", "financeiro"]);
  const canManageEmpresas = () => isAdmin();
  const canManageUsuarios = () => isAdmin();
  const canManageFornecedores = () => isFinanceiro();
  const canApprove = () => isFinanceiro();
  const canImport = () => isFinanceiro();

  return {
    hasRole,
    isAdmin,
    isFinanceiro,
    canManageEmpresas,
    canManageUsuarios,
    canManageFornecedores,
    canApprove,
    canImport,
    role,
  };
}
