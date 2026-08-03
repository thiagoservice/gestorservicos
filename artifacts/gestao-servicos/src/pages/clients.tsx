import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ClientFormDialog, type ClientFormValues } from '@/components/client-form-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '@/components/ui/empty';
import {
  useClients,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from '@/hooks/use-clients';
import type { Client } from '@workspace/api-client-react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function ClientsPage() {
  const { data: clients, isLoading, isError, refetch } = useClients();
  const { createClient, isPending: isCreating } = useCreateClientMutation();
  const { updateClient, isPending: isUpdating } = useUpdateClientMutation();
  const { deleteClient, isPending: isDeleting } = useDeleteClientMutation();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleSubmit = (values: ClientFormValues) => {
    const payload = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    };
    if (editingClient) {
      updateClient(editingClient.id, payload, () => setDialogOpen(false));
    } else {
      createClient(payload, () => setDialogOpen(false));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        description="Cadastro de todos os clientes atendidos pela sua operação."
        actions={
          <Button onClick={handleOpenCreate} data-testid="button-new-client">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="pl-9"
          data-testid="input-search-clients"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar os clientes.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-retry-clients"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Empty className="border rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? 'Tente ajustar sua busca ou cadastre um novo cliente.'
                : 'Comece cadastrando o primeiro cliente da sua operação.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={handleOpenCreate} data-testid="button-empty-new-client">
              <Plus className="h-4 w-4" />
              Cadastrar cliente
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm" data-testid="table-clients">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Nome</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">E-mail</th>
                  <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Telefone</th>
                  <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Endereço</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b last:border-b-0 hover:bg-muted/40 transition-colors group"
                    data-testid={`row-client-${client.id}`}
                  >
                    <td className="px-5 py-3 font-medium" data-testid={`text-client-name-${client.id}`}>
                      {client.name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      {client.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {client.email}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                      {client.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {client.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-xs">
                      {client.address ? (
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(client)}
                          data-testid={`button-edit-client-${client.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmDeleteDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-testid={`button-delete-client-${client.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title="Excluir cliente"
                          description={`Tem certeza que deseja excluir "${client.name}"? Essa ação não pode ser desfeita.`}
                          onConfirm={() => deleteClient(client.id)}
                          isPending={isDeleting}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />
    </AppShell>
  );
}
