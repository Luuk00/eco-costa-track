import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";

export function AdminSubscriptionsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const { setValue, watch, handleSubmit } = useForm();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles:user_id (nome, email),
          empresas:empresa_id (nome, nome_personalizado)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { plan_type, status, trial_ends_at, subscription_ends_at } = data;
      
      await supabase
        .from("subscriptions")
        .update({ 
          plan_type, 
          status,
          trial_ends_at: trial_ends_at || null,
          subscription_ends_at: subscription_ends_at || null,
        })
        .eq("id", selectedSub.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription atualizada!");
      setDialogOpen(false);
      setSelectedSub(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar subscription");
    },
  });

  const handleEdit = (sub: any) => {
    setSelectedSub(sub);
    setValue("plan_type", sub.plan_type);
    setValue("status", sub.status);
    setValue("trial_ends_at", sub.trial_ends_at ? sub.trial_ends_at.split('T')[0] : "");
    setValue("subscription_ends_at", sub.subscription_ends_at ? sub.subscription_ends_at.split('T')[0] : "");
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirada</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "monthly":
        return <Badge className="bg-blue-500">Mensal</Badge>;
      case "annual":
        return <Badge className="bg-purple-500">Anual</Badge>;
      default:
        return <Badge>{planType}</Badge>;
    }
  };

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
          <CardTitle>Todas as Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial Acaba</TableHead>
                <TableHead>Subscription Acaba</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {(sub.profiles as any)?.nome || (sub.profiles as any)?.email || "-"}
                  </TableCell>
                  <TableCell>
                    {(sub.empresas as any)?.nome_personalizado || (sub.empresas as any)?.nome || "-"}
                  </TableCell>
                  <TableCell>{getPlanBadge(sub.plan_type)}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>
                    {sub.trial_ends_at 
                      ? new Date(sub.trial_ends_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {sub.subscription_ends_at 
                      ? new Date(sub.subscription_ends_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(sub)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Subscription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Usuário</Label>
              <div className="text-sm text-muted-foreground">
                {(selectedSub?.profiles as any)?.email}
              </div>
            </div>

            <div>
              <Label htmlFor="plan_type">Plano</Label>
              <Select
                value={watch("plan_type")}
                onValueChange={(value) => setValue("plan_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trial_ends_at">Trial Acaba Em</Label>
              <Input
                id="trial_ends_at"
                type="date"
                value={watch("trial_ends_at") || ""}
                onChange={(e) => setValue("trial_ends_at", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="subscription_ends_at">Subscription Acaba Em</Label>
              <Input
                id="subscription_ends_at"
                type="date"
                value={watch("subscription_ends_at") || ""}
                onChange={(e) => setValue("subscription_ends_at", e.target.value)}
              />
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
