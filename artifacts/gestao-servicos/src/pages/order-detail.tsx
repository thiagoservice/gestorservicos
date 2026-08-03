import { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { AddOrderItemDialog } from '@/components/add-order-item-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { useOrder, useUpdateOrderMutation, useDeleteOrderMutation, useAddOrderServiceItemMutation, useDeleteOrderServiceItemMutation, useAddOrderMaterialItemMutation, useDeleteOrderMaterialItemMutation } from '@/hooks/use-orders';
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
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { data: services } = useServices();
  const { data: materials } = useMaterials();

  const { updateOrder, isPending: isStatusUpdating } = useUpdateOrderMutation();
  const { deleteOrder, isPending: isDeletingOrder } = useDeleteOrderMutation();
  const { addServiceItem, isPending: isAddingService } = useAddOrderServiceItemMutation();
  const { deleteServiceItem } = useDeleteOrderServiceItemMutation();
  const { addMaterialItem, isPending: isAddingMaterial } = useAddOrderMaterialItemMutation();
  const { deleteMaterialItem } = useDeleteOrderMaterialItemMutation();

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);

  if (isLoading) {
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

  if (isError || !order) {
    return (
      <AppShell>
        <Card>
          <CardContent className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar essa ordem de serviço.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-order">
                Tentar novamente
              </Button>
              <Button size="sm" onClick={() => setLocation('/ordens')} data-testid="button-back-orders">
                Voltar para ordens
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5 animate-fade-up">
        <Link
          href="/ordens"
          data-testid="link-back-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ordens de serviço
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1
                className="font-display text-2xl font-semibold tracking-tight"
                data-testid="text-order-title"
              >
                {order.title}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {order.clientName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTimeBR(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={order.status}
              onValueChange={(value) =>
                updateOrder(order.id, { status: value as any })
              }
              disabled={isStatusUpdating}
            >
              <SelectTrigger className="w-44" data-testid="select-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    data-testid={`option-status-${opt.value}`}
                  >
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
              onConfirm={() => deleteOrder(order.id, () => setLocation('/ordens'))}
              isPending={isDeletingOrder}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Descrição
            </h2>
            <p className="text-sm leading-relaxed" data-testid="text-order-description">
              {order.description || 'Nenhuma descrição informada para esta ordem.'}
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
              <p
                className="font-display text-xl font-bold tracking-tight"
                data-testid="text-order-total"
              >
                {formatCurrencyBRL(order.totalPrice)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services section */}
        <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Serviços
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                  {order.serviceItems.length}
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

            {order.serviceItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço adicionado a esta ordem.
                </p>
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
                  {order.serviceItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-service-item-${item.id}`}>
                      <TableCell className="text-sm">{item.serviceName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">
                        {formatCurrencyBRL(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteServiceItem(order.id, item.id)}
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

        {/* Materials section */}
        <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                Materiais
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                  {order.materialItems.length}
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

            {order.materialItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum material adicionado a esta ordem.
                </p>
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
                  {order.materialItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-material-item-${item.id}`}>
                      <TableCell className="text-sm">{item.materialName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">
                        {formatCurrencyBRL(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteMaterialItem(order.id, item.id)}
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

      <AddOrderItemDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        title="Adicionar serviço"
        description="Escolha um serviço do catálogo e informe a quantidade."
        items={services ?? []}
        emptyLabel="Cadastre um serviço no catálogo primeiro"
        isPending={isAddingService}
        onSubmit={(serviceId, quantity, unitPrice) =>
          addServiceItem(order.id, { serviceId, quantity, unitPrice }, () =>
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
          addMaterialItem(order.id, { materialId, quantity, unitPrice }, () =>
            setMaterialDialogOpen(false),
          )
        }
      />
    </AppShell>
  );
}
