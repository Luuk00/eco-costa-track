import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import ObraDetalhes from "./pages/ObraDetalhes";
import Gastos from "./pages/Gastos";
import GastoDetalhes from "./pages/GastoDetalhes";
import Custos from "./pages/Custos";
import ImportarCSV from "./pages/ImportarCSV";
import Empresas from "./pages/Empresas";
import Usuarios from "./pages/Usuarios";
import Fornecedores from "./pages/Fornecedores";
import Aprovacoes from "./pages/Aprovacoes";
import Configuracoes from "./pages/Configuracoes";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <SubscriptionProvider>
              <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/subscription-expired" element={<SubscriptionExpired />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Obras />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/obras/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ObraDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gastos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Gastos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gastos/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GastoDetalhes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/custos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Custos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/importar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImportarCSV />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Configuracoes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <ProtectedRoute requireRole="admin">
                  <Layout>
                    <Empresas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requireRole="admin">
                  <Layout>
                    <Usuarios />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fornecedores"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Fornecedores />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/aprovacoes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Aprovacoes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
              </Routes>
            </SubscriptionProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
