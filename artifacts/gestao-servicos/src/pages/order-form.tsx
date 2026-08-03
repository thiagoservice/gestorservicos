import { useLocation, Link } from 'wouter';
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
import { useCreateOrderMutation } from '@/hooks/use-orders';
import { useClients } from '@/hooks/use-clients';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const orderSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  title: z.string().min(1, 'Informe o título da ordem'),
  description: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrderFormPage() {
  const [, setLocation] = useLocation();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { createOrder, isPending } = useCreateOrderMutation();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { clientId: '', title: '', description: '' },
  });

  const handleSubmit = (values: OrderFormValues) => {
    createOrder(
      {
        clientId: Number(values.clientId),
        title: values.title,
        description: values.description || undefined,
      },
      (order) => setLocation(`/ordens/${order.id}`),
    );
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/ordens">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova ordem de serviço</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Preencha os dados para abrir uma nova ordem de serviço.
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isPending}
          data-testid="button-save-order"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Criar ordem
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 max-w-2xl">

          {/* Dados da Ordem */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Dados da Ordem</h2>
            <p className="text-sm text-muted-foreground mb-4">Informações principais da ordem de serviço.</p>
            <div className="space-y-4">
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
            </div>
          </div>

          {/* Descrição */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Descrição</h2>
            <p className="text-sm text-muted-foreground mb-4">Detalhes adicionais sobre o serviço a ser realizado.</p>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o serviço, observações importantes, local de atendimento..."
                    rows={4}
                    {...field}
                    data-testid="textarea-order-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

        </form>
      </Form>
    </AppShell>
  );
}
