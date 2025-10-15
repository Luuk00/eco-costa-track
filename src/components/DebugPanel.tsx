import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { Card } from "@/components/ui/card";

export function DebugPanel() {
  const { user, profile, role } = useAuth();
  const { isSuperAdmin, isAdmin, hasRole } = usePermission();
  
  return (
    <Card className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-2">🔍 DEBUG PANEL</h3>
      <div className="space-y-1 text-sm font-mono">
        <p><strong>User ID:</strong> {user?.id || "❌ NULL"}</p>
        <p><strong>Email:</strong> {profile?.email || "❌ NULL"}</p>
        <p><strong>Role (context):</strong> {role || "❌ NULL"}</p>
        <p><strong>Empresa ID:</strong> {profile?.empresa_id || "❌ NULL"}</p>
        <hr className="my-2 border-destructive-foreground/20" />
        <p><strong>isSuperAdmin():</strong> {isSuperAdmin() ? "✅ SIM" : "❌ NÃO"}</p>
        <p><strong>isAdmin():</strong> {isAdmin() ? "✅ SIM" : "❌ NÃO"}</p>
        <p><strong>hasRole("admin"):</strong> {hasRole("admin") ? "✅ SIM" : "❌ NÃO"}</p>
        <p><strong>hasRole("super_admin"):</strong> {hasRole("super_admin") ? "✅ SIM" : "❌ NÃO"}</p>
      </div>
    </Card>
  );
}
