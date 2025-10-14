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

  return {
    hasRole,
    isAdmin,
    role,
  };
}
