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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Client } from '@workspace/api-client-react';

const orderSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  title: z.string().min(1, 'Informe o título da ordem'),
  description: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderFormDialog({
  open,
  onOpenChange,
  clients,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSubmit: (values: OrderFormValues) => void;
  isPending?: boolean;
}) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { clientId: '', title: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ clientId: '', title: '', description: '' });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-order-form">
        <DialogHeader>
          <DialogTitle>Nova ordem de serviço</DialogTitle>
          <DialogDescription>
            Crie uma nova ordem vinculada a um cliente. Você poderá adicionar
            serviços e materiais depois.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="form-order"
          >
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-order-client">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Cadastre um cliente primeiro
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={String(client.id)}
                            data-testid={`option-client-${client.id}`}
                          >
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Reparo hidráulico cozinha"
                      data-testid="input-order-title"
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
                      placeholder="Detalhes do serviço a ser executado"
                      rows={3}
                      data-testid="input-order-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-order"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || clients.length === 0}
                data-testid="button-save-order"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar ordem
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
