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
  useMaterial,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from '@/hooks/use-materials';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const materialSchema = z.object({
  name: z.string().min(1, 'Informe o nome do material'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Informe a unidade'),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function MaterialFormPage() {
  const params = useParams<{ id?: string }>();
  const materialId = params.id ? Number(params.id) : undefined;
  const isEdit = !!materialId;
  const [, setLocation] = useLocation();

  const { data: material, isLoading } = useMaterial(materialId);
  const { createMaterial, isPending: isCreating } = useCreateMaterialMutation();
  const { updateMaterial, isPending: isUpdating } = useUpdateMaterialMutation();

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { name: '', description: '', unit: '' },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        description: material.description ?? '',
        unit: material.unit,
      });
    }
  }, [material, form]);

  const handleSubmit = (values: MaterialFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      unit: values.unit,
    };
    if (isEdit && materialId) {
      updateMaterial(materialId, payload, () => setLocation('/materiais'));
    } else {
      createMaterial(payload, () => setLocation('/materiais'));
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
          <Link href="/materiais">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Editar material' : 'Novo material'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? 'Atualize as informações do material.'
                : 'Preencha os dados para cadastrar um novo material.'}
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isCreating || isUpdating}
          data-testid="button-save-material"
        >
          {(isCreating || isUpdating) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? 'Salvar alterações' : 'Criar material'}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 max-w-2xl">

          {/* Dados Básicos */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Dados Básicos</h2>
            <p className="text-sm text-muted-foreground mb-4">Identificação do material.</p>
            <div className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do material *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cabo elétrico 2,5mm" {...field} data-testid="input-material-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes sobre este material..."
                      rows={3}
                      {...field}
                      data-testid="textarea-material-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Unidade */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold text-primary mb-1">Cobrança</h2>
            <p className="text-sm text-muted-foreground mb-4">Unidade de medida usada ao lançar o material numa ordem.</p>
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Unidade *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: m, kg, un, peça" {...field} data-testid="input-material-unit" />
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
