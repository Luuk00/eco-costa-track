import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, RefreshCw, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export function UserMenu() {
  const { profile, role, signOut, refetchProfile } = useAuth();

  const handleRefetchPermissions = async () => {
    await refetchProfile();
    toast.success("Permissões recarregadas!");
  };

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string | null) => {
    if (role === "admin") return "Administrador";
    if (role === "financeiro") return "Financeiro";
    if (role === "colaborador") return "Colaborador";
    return "Usuário";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(profile?.nome || null)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.nome || "Usuário"}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {getRoleLabel(role)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRefetchPermissions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Recarregar Permissões</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
