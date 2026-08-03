import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/components/app-shell';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
  useClient,
  useCreateClientMutation,
  useUpdateClientMutation,
} from '@/hooks/use-clients';
import {
  useEquipments,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
} from '@/hooks/use-equipments';
import type { Equipment } from '@workspace/api-client-react';
import {
  ArrowLeft,
  Save,
  Plus,
  Pencil,
  Trash2,
  Monitor,
  Loader2,
} from 'lucide-react';

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const clientSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const equipSchema = z.object({
  name: z.string().min(1, 'Informe o nome do equipamento'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;
type EquipFormValues = z.infer<typeof equipSchema>;

function EquipmentRow({
  equip,
  clientId,
}: {
  equip: Equipment;
  clientId: number;
}) {
  const [editing, setEditing] = useState(false);
  const { updateEquipment, isPending: isUpdating } = useUpdateEquipmentMutation(clientId);
  const { deleteEquipment, isPending: isDeleting } = useDeleteEquipmentMutation(clientId);

  const form = useForm<EquipFormValues>({
    resolver: zodResolver(equipSchema),
    defaultValues: {
      name: equip.name,
      brand: equip.brand ?? '',
      model: equip.model ?? '',
      serialNumber: equip.serialNumber ?? '',
      notes: equip.notes ?? '',
    },
  });

  const handleSave = (values: EquipFormValues) => {
    updateEquipment(equip.id, values, () => setEditing(false));
  };

  if (editing) {
    return (
      <tr className="border-b last:border-b-0 bg-muted/30">
        <td colSpan={5} className="px-4 py-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input {...field} data-testid="input-equip-name-edit" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Série</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Salvar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors group" data-testid={`row-equip-${equip.id}`}>
      <td className="px-4 py-3 font-medium">{equip.name}</td>
      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{equip.brand ?? '—'}</td>
      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{equip.model ?? '—'}</td>
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{equip.serialNumber ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)} data-testid={`button-edit-equip-${equip.id}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <ConfirmDeleteDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-equip-${equip.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Excluir equipamento"
            description={`Tem certeza que deseja excluir "${equip.name}"?`}
            onConfirm={() => deleteEquipment(equip.id)}
            isPending={isDeleting}
          />
        </div>
      </td>
    </tr>
  );
}

function AddEquipmentRow({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const { createEquipment, isPending } = useCreateEquipmentMutation(clientId);

  const form = useForm<EquipFormValues>({
    resolver: zodResolver(equipSchema),
    defaultValues: { name: '', brand: '', model: '', serialNumber: '', notes: '' },
  });

  const handleSubmit = (values: EquipFormValues) => {
    createEquipment(values, () => {
      form.reset();
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="button-add-equipment">
            <Plus className="h-3.5 w-3.5" />
            Adicionar equipamento
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-muted/20">
      <td colSpan={5} className="px-4 py-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="Ex: Notebook" {...field} data-testid="input-equip-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl><Input placeholder="Ex: Dell" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input placeholder="Ex: Inspiron 15" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="serialNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº de Série</FormLabel>
                  <FormControl><Input placeholder="Ex: SN123456" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Adicionar
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); form.reset(); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </td>
    </tr>
  );
}

export default function ClientFormPage() {
  const params = useParams<{ id?: string }>();
  const clientId = params.id ? Number(params.id) : undefined;
  const isEdit = !!clientId;
  const [, setLocation] = useLocation();

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: equipments, isLoading: equipsLoading } = useEquipments(clientId);
  const { createClient, isPending: isCreating } = useCreateClientMutation();
  const { updateClient, isPending: isUpdating } = useUpdateClientMutation();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', city: '', state: '', address: '', notes: '' },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        city: client.city ?? '',
        state: client.state ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      });
    }
  }, [client, form]);

  const handleSubmit = (values: ClientFormValues) => {
    const payload = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    };
    if (isEdit && clientId) {
      updateClient(clientId, payload, () => setLocation('/clientes'));
    } else {
      createClient(payload, () => setLocation('/clientes'));
    }
  };

  if (isEdit && clientLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? `Cliente #${client?.code ?? '—'}` : 'Novo Cliente'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? 'Atualize os dados do cliente e gerencie os equipamentos.'
                : 'Preencha os dados para cadastrar um novo cliente.'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isCreating || isUpdating}
          data-testid="button-save-client"
        >
          {(isCreating || isUpdating) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? 'Salvar alterações' : 'Criar cliente'}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 max-w-3xl">

          {/* Dados Básicos */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Dados Básicos</h2>
            <p className="text-sm text-muted-foreground mb-4">Informações principais do cliente.</p>
            <div className="space-y-4">
              {isEdit && client && (
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <div className="mt-1.5">
                    <Input value={client.code} readOnly className="bg-muted/50 cursor-default w-40 font-mono" data-testid="input-client-code" />
                  </div>
                </div>
              )}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} data-testid="input-client-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Contato</h2>
            <p className="text-sm text-muted-foreground mb-4">Telefone e e-mail para comunicação.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@email.com" {...field} data-testid="input-client-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} data-testid="input-client-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Localização */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Localização</h2>
            <p className="text-sm text-muted-foreground mb-4">Cidade, estado e endereço completo.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo" {...field} data-testid="input-client-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        data-testid="select-client-state"
                      >
                        <option value="">Selecione</option>
                        {BR_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores, 123 — Bairro" {...field} data-testid="input-client-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Observações */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Observações</h2>
            <p className="text-sm text-muted-foreground mb-4">Anotações internas sobre o cliente.</p>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Ex: Cliente prefere atendimento às terças-feiras." rows={3} {...field} data-testid="textarea-client-notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

        </form>
      </Form>

      {/* Equipamentos — só no modo edição */}
      {isEdit && clientId && (
        <div className="rounded-xl border bg-card mt-5 max-w-3xl">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-base font-semibold">Equipamentos</h2>
              <p className="text-xs text-muted-foreground">Equipamentos cadastrados para este cliente.</p>
            </div>
          </div>
          {equipsLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left font-medium px-4 py-2">Nome</th>
                  <th className="text-left font-medium px-4 py-2 hidden sm:table-cell">Marca</th>
                  <th className="text-left font-medium px-4 py-2 hidden sm:table-cell">Modelo</th>
                  <th className="text-left font-medium px-4 py-2 hidden md:table-cell">Nº Série</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {(equipments ?? []).map((equip) => (
                  <EquipmentRow key={equip.id} equip={equip} clientId={clientId} />
                ))}
                <AddEquipmentRow clientId={clientId} />
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
}
