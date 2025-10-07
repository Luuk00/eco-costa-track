import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import ObraDetalhes from "./pages/ObraDetalhes";
import Gastos from "./pages/Gastos";
import GastoDetalhes from "./pages/GastoDetalhes";
import Custos from "./pages/Custos";
import ImportarCSV from "./pages/ImportarCSV";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/obras" element={<Obras />} />
            <Route path="/obras/:id" element={<ObraDetalhes />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/gastos/:id" element={<GastoDetalhes />} />
            <Route path="/custos" element={<Custos />} />
            <Route path="/importar" element={<ImportarCSV />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
