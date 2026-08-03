import { Link } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSummary } from '@/hooks/use-summary';
import { useOrders } from '@/hooks/use-orders';
import { formatCurrencyBRL, formatDateBR } from '@/lib/format';
import {
  Users,
  Wrench,
  Package,
  ClipboardList,
  Clock,
  Loader2,
  CheckCircle2,
  Wallet,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } =
    useSummary();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const recentOrders = orders
    ? [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6)
    : [];

  const stats = [
    {
      label: 'Total de clientes',
      value: summary?.totalClients,
      icon: Users,
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Pendentes',
      value: summary?.pendingOrders,
      icon: Clock,
      accent: 'text-chart-5',
      bg: 'bg-chart-5/10',
    },
    {
      label: 'Em andamento',
      value: summary?.inProgressOrders,
      icon: Loader2,
      accent: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      label: 'Concluídas',
      value: summary?.completedOrders,
      icon: CheckCircle2,
      accent: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Painel geral"
        description="Visão rápida da operação: clientes, ordens em curso e faturamento realizado."
      />

      {summaryError && (
        <div
          className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-up"
          data-testid="banner-summary-error"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Não foi possível carregar os indicadores agora. Tente atualizar a página.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
              data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.accent}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="font-display text-2xl md:text-3xl font-bold tracking-tight leading-none">
                    {stat.value ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 md:mt-6">
        <Card className="lg:col-span-1 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <CardContent className="p-5 md:p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent mb-4">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Receita de ordens concluídas
              </p>
              {summaryLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <p
                  className="font-display text-3xl font-bold tracking-tight text-foreground"
                  data-testid="text-total-revenue"
                >
                  {formatCurrencyBRL(summary?.totalRevenue ?? 0)}
                </p>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {summaryLoading ? '—' : summary?.totalServices ?? 0} serviços
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {summaryLoading ? '—' : summary?.totalMaterials ?? 0} materiais
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base tracking-tight">
                Ordens recentes
              </h2>
              <Link
                href="/ordens"
                data-testid="link-ver-todas-ordens"
                className="text-xs font-medium text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ordem de serviço criada ainda.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/ordens" data-testid="link-criar-primeira-ordem">
                    Criar primeira ordem
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/ordens/${order.id}`}
                    data-testid={`link-order-row-${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover-elevate -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {order.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.clientName} · {formatDateBR(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-mono font-medium">
                        {formatCurrencyBRL(order.totalPrice)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
