import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import ClientsPage from '@/pages/clients';
import ClientFormPage from '@/pages/client-form';
import ServicesPage from '@/pages/services';
import ServiceFormPage from '@/pages/service-form';
import MaterialsPage from '@/pages/materials';
import MaterialFormPage from '@/pages/material-form';
import OrdersPage from '@/pages/orders';
import OrderFormPage from '@/pages/order-form';
import OrderDetailPage from '@/pages/order-detail';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />

      <Route path="/clientes" component={ClientsPage} />
      <Route path="/clientes/novo" component={ClientFormPage} />
      <Route path="/clientes/:id" component={ClientFormPage} />

      <Route path="/servicos" component={ServicesPage} />
      <Route path="/servicos/novo" component={ServiceFormPage} />
      <Route path="/servicos/:id" component={ServiceFormPage} />

      <Route path="/materiais" component={MaterialsPage} />
      <Route path="/materiais/novo" component={MaterialFormPage} />
      <Route path="/materiais/:id" component={MaterialFormPage} />

      <Route path="/ordens" component={OrdersPage} />
      <Route path="/ordens/novo" component={OrderFormPage} />
      <Route path="/ordens/:id" component={OrderDetailPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
