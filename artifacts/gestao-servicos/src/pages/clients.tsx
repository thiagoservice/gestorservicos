import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
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
  useDeleteClientMutation,
} from '@/hooks/use-clients';
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
  const [, setLocation] = useLocation();
  const { data: clients, isLoading, isError, refetch } = useClients();
  const { deleteClient, isPending: isDeleting } = useDeleteClientMutation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        (c.code && c.code.includes(q)),
    );
  }, [clients, search]);

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        description="Cadastro de todos os clientes atendidos pela sua operação."
        actions={
          <Button onClick={() => setLocation('/clientes/novo')} data-testid="button-new-client">
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
          placeholder="Buscar por código, nome, e-mail, cidade..."
          className="pl-9"
          data-testid="input-search-clients"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-16" />
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
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-clients">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Empty className="border rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
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
            <Button onClick={() => setLocation('/clientes/novo')} data-testid="button-empty-new-client">
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
                  <th className="text-left font-medium px-5 py-3 w-24">Código</th>
                  <th className="text-left font-medium px-5 py-3">Nome</th>
                  <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">E-mail</th>
                  <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Telefone</th>
                  <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Cidade / UF</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b last:border-b-0 hover:bg-muted/40 transition-colors group cursor-pointer"
                    data-testid={`row-client-${client.id}`}
                    onClick={() => setLocation(`/clientes/${client.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {client.code}
                    </td>
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
                    <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">
                      {client.city || client.state ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {[client.city, client.state].filter(Boolean).join(' / ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td
                      className="px-5 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setLocation(`/clientes/${client.id}`)}
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
    </AppShell>
  );
}
