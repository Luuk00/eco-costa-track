import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Search, Key, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

export function AdminUsuariosTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [confirmPlanChange, setConfirmPlanChange] = useState<{open: boolean, userId: string, planType: string, userName: string} | null>(null);
  const [confirmPasswordReset, setConfirmPasswordReset] = useState<{open: boolean, userEmail: string, userName: string} | null>(null);
  const queryClient = useQueryClient();
  const { setValue, watch, handleSubmit } = useForm();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role),
          empresas:empresa_id (nome, nome_personalizado),
          subscriptions (plan_type, status, trial_ends_at)
        `)
        .order("nome");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: empresas } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, planType }: { userId: string; planType: string }) => {
      const now = new Date();
      let updates: any = {
        plan_type: planType,
        updated_at: now.toISOString(),
        started_at: now.toISOString(),
        status: 'active'
      };

      if (planType === 'annual') {
        updates.subscription_ends_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        updates.trial_ends_at = null;
      } else if (planType === 'monthly') {
        updates.subscription_ends_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        updates.trial_ends_at = null;
      } else if (planType === 'trial') {
        updates.trial_ends_at = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        updates.subscription_ends_at = null;
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Plano e data de expiração atualizados com sucesso!");
      setConfirmPlanChange(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar plano");
      setConfirmPlanChange(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email de redefinição de senha enviado com sucesso!");
      setConfirmPasswordReset(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar email de redefinição");
      setConfirmPasswordReset(null);
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { nome, empresa_id, role } = data;
      
      await supabase
        .from("profiles")
        .update({ nome: nome.trim(), empresa_id })
        .eq("id", selectedUser.id);

      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      if (role) {
        await supabase
          .from("user_roles")
          .insert({ user_id: selectedUser.id, role });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Usuário atualizado!");
      setDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar usuário");
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setValue("nome", user.nome || "");
    setValue("empresa_id", user.empresa_id || "");
    setValue("role", (user.user_roles as any)?.[0]?.role || "");
    setDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Super Admin</Badge>;
      case "admin":
        return <Badge variant="destructive">Administrador</Badge>;
      case "financeiro":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Financeiro</Badge>;
      case "colaborador":
        return <Badge variant="secondary">Colaborador</Badge>;
      default:
        return <Badge variant="outline">Sem função</Badge>;
    }
  };

  const handlePlanChange = (userId: string, planType: string, userName: string) => {
    const planNames = { trial: '🎁 Trial (7 dias)', monthly: '📅 Mensal (30 dias)', annual: '📆 Anual (365 dias)' };
    setConfirmPlanChange({ open: true, userId, planType, userName: planNames[planType as keyof typeof planNames] });
  };

  const handlePasswordReset = (userEmail: string, userName: string) => {
    setConfirmPasswordReset({ open: true, userEmail, userName });
  };

  const filteredUsuarios = usuarios?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.nome?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  }) || [];

  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE);
  const paginatedUsuarios = filteredUsuarios.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsuarios.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.empresas?.nome_personalizado || user.empresas?.nome || "-"}</TableCell>
                  <TableCell>
                    {getRoleBadge((user.user_roles as any)?.[0]?.role)}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={(user.subscriptions as any)?.[0]?.plan_type || "trial"}
                      onValueChange={(value) => handlePlanChange(user.id, value, user.nome)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">🎁 Trial</SelectItem>
                        <SelectItem value="monthly">📅 Mensal</SelectItem>
                        <SelectItem value="annual">📆 Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePasswordReset(user.email, user.nome)}
                        title="Resetar senha"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({filteredUsuarios.length} usuários)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmPlanChange?.open || false} onOpenChange={(open) => !open && setConfirmPlanChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar mudança de plano</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja mudar o plano de <strong>{selectedUser?.nome}</strong> para <strong>{confirmPlanChange?.userName}</strong>?
              <br /><br />
              A data de expiração será automaticamente atualizada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPlanChange && updatePlanMutation.mutate({ userId: confirmPlanChange.userId, planType: confirmPlanChange.planType })}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPasswordReset?.open || false} onOpenChange={(open) => !open && setConfirmPasswordReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha do usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Enviar email de redefinição de senha para <strong>{confirmPasswordReset?.userName}</strong> ({confirmPasswordReset?.userEmail})?
              <br /><br />
              O usuário receberá um link para criar uma nova senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPasswordReset && resetPasswordMutation.mutate(confirmPasswordReset.userEmail)}>
              Enviar Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
            </div>

            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={watch("nome") || ""}
                onChange={(e) => setValue("nome", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="empresa_id">Empresa</Label>
              <Select
                value={watch("empresa_id")}
                onValueChange={(value) => setValue("empresa_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {empresas?.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome_personalizado || empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Função</Label>
              <Select
                value={watch("role")}
                onValueChange={(value) => setValue("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}