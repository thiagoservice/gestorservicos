import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ChecklistTemplate } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const schema = z.object({ name: z.string().min(1, 'Informe o item do checklist') });
export type ChecklistFormValues = z.infer<typeof schema>;

export function ChecklistFormDialog({ open, onOpenChange, item, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ChecklistTemplate | null;
  onSubmit: (values: ChecklistFormValues) => void;
  isPending?: boolean;
}) {
  const form = useForm<ChecklistFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  useEffect(() => {
    if (open) form.reset({ name: item?.name ?? '' });
  }, [open, item, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-checklist-form">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar item' : 'Novo item de checklist'}</DialogTitle>
          <DialogDescription>Este item poderá ser aplicado a qualquer ordem de serviço.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição do item</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Verificar aterramento elétrico" data-testid="input-checklist-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-checklist">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {item ? 'Salvar alterações' : 'Cadastrar item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}