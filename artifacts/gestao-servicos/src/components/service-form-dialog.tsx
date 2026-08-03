import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';
import type { Service } from '@workspace/api-client-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Informe o nome do serviço'),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Preço deve ser positivo'),
  unit: z.string().min(1, 'Informe a unidade'),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (values: ServiceFormValues) => void;
  isPending?: boolean;
}) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', unitPrice: 0, unit: 'hora' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        unitPrice: service?.unitPrice ?? 0,
        unit: service?.unit ?? 'hora',
      });
    }
  }, [open, service, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-service-form">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Editar serviço' : 'Novo serviço'}
          </DialogTitle>
          <DialogDescription>
            {service
              ? 'Atualize as informações do serviço do seu catálogo.'
              : 'Cadastre um serviço para adicionar às ordens.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="form-service"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Instalação elétrica"
                      data-testid="input-service-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre o serviço prestado"
                      rows={3}
                      data-testid="input-service-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço unitário (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        data-testid="input-service-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="hora, m², unidade..."
                        data-testid="input-service-unit"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-service"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-service"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {service ? 'Salvar alterações' : 'Cadastrar serviço'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
