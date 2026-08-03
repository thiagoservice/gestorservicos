import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import {
  ServiceFormDialog,
  type ServiceFormValues,
} from '@/components/service-form-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  useServices,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '@/hooks/use-services';
import type { Service } from '@workspace/api-client-react';
import { formatCurrencyBRL } from '@/lib/format';
import { Plus, Pencil, Trash2, Wrench, AlertTriangle } from 'lucide-react';

export default function ServicesPage() {
  const { data: services, isLoading, isError, refetch } = useServices();
  const { createService, isPending: isCreating } = useCreateServiceMutation();
  const { updateService, isPending: isUpdating } = useUpdateServiceMutation();
  const { deleteService, isPending: isDeleting } = useDeleteServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleOpenCreate = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleSubmit = (values: ServiceFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      unitPrice: values.unitPrice,
      unit: values.unit,
    };
    if (editingService) {
      updateService(editingService.id, payload, () => setDialogOpen(false));
    } else {
      createService(payload, () => setDialogOpen(false));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Catálogo de serviços"
        description="Serviços oferecidos, com preço e unidade de cobrança."
        actions={
          <Button onClick={handleOpenCreate} data-testid="button-new-service">
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar os serviços.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-retry-services"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : !services || services.length === 0 ? (
        <Empty className="border rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench />
            </EmptyMedia>
            <EmptyTitle>Nenhum serviço cadastrado</EmptyTitle>
            <EmptyDescription>
              Monte seu catálogo cadastrando os serviços que sua empresa oferece.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={handleOpenCreate} data-testid="button-empty-new-service">
              <Plus className="h-4 w-4" />
              Cadastrar serviço
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="overflow-hidden animate-fade-up">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">
                  Descrição
                </TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="w-[96px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow
                  key={service.id}
                  data-testid={`row-service-${service.id}`}
                >
                  <TableCell className="font-medium">
                    {service.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                    {service.description || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {service.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrencyBRL(service.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEdit(service)}
                        data-testid={`button-edit-service-${service.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <ConfirmDeleteDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-testid={`button-delete-service-${service.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Excluir serviço"
                        description={`Tem certeza que deseja excluir "${service.name}" do catálogo?`}
                        onConfirm={() => deleteService(service.id)}
                        isPending={isDeleting}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />
    </AppShell>
  );
}
