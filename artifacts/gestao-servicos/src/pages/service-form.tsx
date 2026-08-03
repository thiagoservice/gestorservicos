import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
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
import {
  useService,
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '@/hooks/use-services';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Informe o nome do serviço'),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  unit: z.string().min(1, 'Informe a unidade de cobrança'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServiceFormPage() {
  const params = useParams<{ id?: string }>();
  const serviceId = params.id ? Number(params.id) : undefined;
  const isEdit = !!serviceId;
  const [, setLocation] = useLocation();

  const { data: service, isLoading } = useService(serviceId);
  const { createService, isPending: isCreating } = useCreateServiceMutation();
  const { updateService, isPending: isUpdating } = useUpdateServiceMutation();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', unitPrice: 0, unit: '' },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description ?? '',
        unitPrice: service.unitPrice,
        unit: service.unit,
      });
    }
  }, [service, form]);

  const handleSubmit = (values: ServiceFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      unitPrice: values.unitPrice,
      unit: values.unit,
    };
    if (isEdit && serviceId) {
      updateService(serviceId, payload, () => setLocation('/servicos'));
    } else {
      createService(payload, () => setLocation('/servicos'));
    }
  };

  if (isEdit && isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/servicos">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Editar serviço' : 'Novo serviço'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? 'Atualize as informações do serviço.'
                : 'Preencha os dados para cadastrar um novo serviço.'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isCreating || isUpdating}
          data-testid="button-save-service"
        >
          {(isCreating || isUpdating) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? 'Salvar alterações' : 'Criar serviço'}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 max-w-2xl">

          {/* Dados Básicos */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Dados Básicos</h2>
            <p className="text-sm text-muted-foreground mb-4">Identificação do serviço no catálogo.</p>
            <div className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do serviço *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Instalação elétrica" {...field} data-testid="input-service-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes sobre este serviço..."
                      rows={3}
                      {...field}
                      data-testid="textarea-service-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Precificação */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Precificação</h2>
            <p className="text-sm text-muted-foreground mb-4">Preço e unidade de cobrança para cálculo nas ordens.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="unitPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço unitário (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      data-testid="input-service-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: hora, m², serviço" {...field} data-testid="input-service-unit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

        </form>
      </Form>
    </AppShell>
  );
}
