import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, CreditCard, BarChart3 } from "lucide-react";
import { AdminUsuariosTab } from "@/components/admin/AdminUsuariosTab";
import { AdminEmpresasTab } from "@/components/admin/AdminEmpresasTab";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";
import { AdminStatsTab } from "@/components/admin/AdminStatsTab";

export default function AdminGeral() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administração Geral</h1>
        <p className="text-muted-foreground">
          Painel de controle super admin - FINANTRACKER
        </p>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="empresas">
            <Building className="mr-2 h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <AdminUsuariosTab />
        </TabsContent>

        <TabsContent value="empresas">
          <AdminEmpresasTab />
        </TabsContent>

        <TabsContent value="subscriptions">
          <AdminSubscriptionsTab />
        </TabsContent>

        <TabsContent value="stats">
          <AdminStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
