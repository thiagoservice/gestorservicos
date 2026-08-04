import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { AddOrderItemDialog } from '@/components/add-order-item-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  useOrder,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useAddOrderServiceItemMutation,
  useDeleteOrderServiceItemMutation,
  useAddOrderMaterialItemMutation,
  useDeleteOrderMaterialItemMutation,
} from '@/hooks/use-orders';
import { useClients } from '@/hooks/use-clients';
import { useServices } from '@/hooks/use-services';
import { useMaterials } from '@/hooks/use-materials';
import { formatCurrencyBRL, formatDateTimeBR, ORDER_STATUS_OPTIONS } from '@/lib/format';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Wrench,
  Package,
  User,
  Calendar,
  AlertTriangle,
  Wallet,
  Save,
  Loader2,
} from 'lucide-react';

/* ─── schema for create/edit form ─── */
const orderSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  title: z.string().min(1, 'Informe o título da ordem'),
  description: z.string().optional(),
});
type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'novo';
  const orderId = isNew ? undefined : Number(params.id);
  const [, setLocation] = useLocation();

  /* ─── data fetching ─── */
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: services } = useServices();
  const { data: materials } = useMaterials();

  /* ─── mutations ─── */
  const { createOrder, isPending: isCreating } = useCreateOrderMutation();
  const { updateOrder, isPending: isStatusUpdating } = useUpdateOrderMutation();
  const { deleteOrder, isPending: isDeletingOrder } = useDeleteOrderMutation();
  const { addServiceItem, isPending: isAddingService } = useAddOrderServiceItemMutation();
  const { deleteServiceItem } = useDeleteOrderServiceItemMutation();
  const { addMaterialItem, isPending: isAddingMaterial } = useAddOrderMaterialItemMutation();
  const { deleteMaterialItem } = useDeleteOrderMaterialItemMutation();

  /* ─── dialogs ─── */
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);

  /* ─── form (used for create mode) ─── */
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { clientId: '', title: '', description: '' },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        clientId: String(order.clientId),
        title: order.title,
        description: order.description ?? '',
      });
    }
  }, [order, form]);

  const handleCreate = (values: OrderFormValues) => {
    createOrder(
      {
        clientId: Number(values.clientId),
        title: values.title,
        description: values.description || undefined,
      },
      (created) => setLocation(`/ordens/${created.id}`),
    );
  };

  /* ─── loading skeleton ─── */
  if (!isNew && isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  /* ─── error state ─── */
  if (!isNew && (isError || !order)) {
    return (
      <AppShell>
        <Card>
          <CardContent className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar essa ordem de serviço.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
              <Button size="sm" onClick={() => setLocation('/ordens')}>
                Voltar para ordens
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  /* ══════════════════════════════════════════════════════
     NEW ORDER MODE  (/ordens/novo)
  ══════════════════════════════════════════════════════ */
  if (isNew) {
    return (
      <AppShell>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/ordens">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nova ordem de serviço</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Preencha os dados para abrir a ordem. Os itens são adicionados em seguida.
              </p>
            </div>
          </div>
          <Button
            onClick={form.handleSubmit(handleCreate)}
            disabled={isCreating}
            data-testid="button-save-order"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Criar ordem
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5">
            {/* Dados básicos */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold text-primary mb-1">Dados da Ordem</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Informações principais da ordem de serviço.
              </p>
              <div className="space-y-4 max-w-2xl">
                <FormField control={form.control} name="clientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      {clientsLoading ? (
                        <Skeleton className="h-9 w-full" />
                      ) : (
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          data-testid="select-order-client"
                        >
                          <option value="">Selecione um cliente</option>
                          {(clients ?? []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} — {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Reforma elétrica completa"
                        {...field}
                        data-testid="input-order-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o serviço, observações importantes, local de atendimento..."
                        rows={3}
                        {...field}
                        data-testid="textarea-order-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Items preview — locked until order is saved */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Serviços
                  </h2>
                  <Button size="sm" variant="outline" disabled>
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Crie a ordem para adicionar serviços.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent" />
                    Materiais
                  </h2>
                  <Button size="sm" variant="outline" disabled>
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Crie a ordem para adicionar materiais.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </AppShell>
    );
  }

  /* ══════════════════════════════════════════════════════
     EXISTING ORDER MODE  (/ordens/:id)
  ══════════════════════════════════════════════════════ */
  return (
    <AppShell>
      <div className="mb-5 animate-fade-up">
        <Link
          href="/ordens"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ordens de serviço
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight" data-testid="text-order-title">
                {order!.title}
              </h1>
              <StatusBadge status={order!.status} />
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {order!.clientName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTimeBR(order!.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={order!.status}
              onValueChange={(value) => updateOrder(order!.id, { status: value as any })}
              disabled={isStatusUpdating}
            >
              <SelectTrigger className="w-44" data-testid="select-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} data-testid={`option-status-${opt.value}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConfirmDeleteDialog
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-order"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Excluir ordem de serviço"
              description="Tem certeza que deseja excluir esta ordem? Todos os itens vinculados também serão removidos."
              onConfirm={() => deleteOrder(order!.id, () => setLocation('/ordens'))}
              isPending={isDeletingOrder}
            />
          </div>
        </div>
      </div>

      {/* Description + total */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Descrição
            </h2>
            <p className="text-sm leading-relaxed" data-testid="text-order-description">
              {order!.description || 'Nenhuma descrição informada para esta ordem.'}
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-display text-xl font-bold tracking-tight" data-testid="text-order-total">
                {formatCurrencyBRL(order!.totalPrice)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services */}
        <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Serviços
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                  {order!.serviceItems.length}
                </Badge>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setServiceDialogOpen(true)}
                data-testid="button-add-service-item"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {order!.serviceItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum serviço adicionado a esta ordem.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order!.serviceItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-service-item-${item.id}`}>
                      <TableCell className="text-sm">{item.serviceName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">
                        {formatCurrencyBRL(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteServiceItem(order!.id, item.id)}
                          data-testid={`button-remove-service-item-${item.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                Materiais
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                  {order!.materialItems.length}
                </Badge>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMaterialDialogOpen(true)}
                data-testid="button-add-material-item"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {order!.materialItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum material adicionado a esta ordem.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order!.materialItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-material-item-${item.id}`}>
                      <TableCell className="text-sm">{item.materialName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">
                        {formatCurrencyBRL(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteMaterialItem(order!.id, item.id)}
                          data-testid={`button-remove-material-item-${item.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddOrderItemDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        title="Adicionar serviço"
        description="Escolha um serviço do catálogo e informe a quantidade."
        items={services ?? []}
        emptyLabel="Cadastre um serviço no catálogo primeiro"
        isPending={isAddingService}
        onSubmit={(serviceId, quantity, unitPrice) =>
          addServiceItem(order!.id, { serviceId, quantity, unitPrice }, () =>
            setServiceDialogOpen(false),
          )
        }
      />
      <AddOrderItemDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        title="Adicionar material"
        description="Escolha um material do estoque e informe a quantidade."
        items={materials ?? []}
        emptyLabel="Cadastre um material no estoque primeiro"
        isPending={isAddingMaterial}
        onSubmit={(materialId, quantity, unitPrice) =>
          addMaterialItem(order!.id, { materialId, quantity, unitPrice }, () =>
            setMaterialDialogOpen(false),
          )
        }
      />
    </AppShell>
  );
}
