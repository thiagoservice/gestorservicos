import { useState, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { OrderFormDialog, type OrderFormValues } from '@/components/order-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '@/components/ui/empty';
import { useOrders, useCreateOrderMutation } from '@/hooks/use-orders';
import { useClients } from '@/hooks/use-clients';
import { formatCurrencyBRL, formatDateBR } from '@/lib/format';
import {
  Plus,
  Search,
  ClipboardList,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export default function OrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const { data: clients } = useClients();
  const { createOrder, isPending: isCreating } = useCreateOrderMutation();
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!orders) return [];
    let list = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, search, statusFilter]);

  const handleSubmit = (values: OrderFormValues) => {
    createOrder(
      {
        clientId: Number(values.clientId),
        title: values.title,
        description: values.description || undefined,
      },
      (order) => {
        setDialogOpen(false);
        setLocation(`/ordens/${order.id}`);
      },
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Ordens de serviço"
        description="Acompanhe o andamento de cada atendimento, do pedido à conclusão."
        actions={
          <Button onClick={() => setDialogOpen(true)} data-testid="button-new-order">
            <Plus className="h-4 w-4" />
            Nova ordem
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou cliente..."
            className="pl-9"
            data-testid="input-search-orders"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar as ordens de serviço.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-retry-orders"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Empty className="border rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>
              {orders && orders.length > 0
                ? 'Nenhuma ordem encontrada'
                : 'Nenhuma ordem de serviço criada'}
            </EmptyTitle>
            <EmptyDescription>
              {orders && orders.length > 0
                ? 'Ajuste os filtros de busca para encontrar ordens.'
                : 'Crie a primeira ordem de serviço para começar a acompanhar seus atendimentos.'}
            </EmptyDescription>
          </EmptyHeader>
          {(!orders || orders.length === 0) && (
            <EmptyContent>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-empty-new-order">
                <Plus className="h-4 w-4" />
                Criar ordem de serviço
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <Card className="overflow-hidden animate-fade-up">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Criada em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setLocation(`/ordens/${order.id}`)}
                  data-testid={`row-order-${order.id}`}
                >
                  <TableCell className="font-medium max-w-[220px] truncate">
                    {order.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.clientName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {formatDateBR(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrencyBRL(order.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/ordens/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`link-open-order-${order.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover-elevate"
                    >
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <OrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients ?? []}
        onSubmit={handleSubmit}
        isPending={isCreating}
      />
    </AppShell>
  );
}
