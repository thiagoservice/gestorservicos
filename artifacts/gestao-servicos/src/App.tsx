import { useState } from 'react';
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
import OrderDetailPage from '@/pages/order-detail';
import CompanyPage from '@/pages/company';
import ChecklistsPage from '@/pages/checklists';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Hammer, Loader2 } from 'lucide-react';

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
      <Route path="/ordens/:id" component={OrderDetailPage} />
      <Route path="/empresa" component={CompanyPage} />
      <Route path="/checklist" component={ChecklistsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background bg-noise p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-4">
              <Hammer className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Gestão de Serviços</h1>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para acessar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                data-testid="input-login-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
