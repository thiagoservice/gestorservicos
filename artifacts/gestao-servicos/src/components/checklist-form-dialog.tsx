import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Checklist } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome do checklist'),
  items: z.array(z.object({ name: z.string().min(1, 'Informe a descrição do item') })).min(1, 'Adicione pelo menos um item'),
});
export type ChecklistFormValues = z.infer<typeof schema>;

export function ChecklistFormDialog({ open, onOpenChange, checklist, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist?: Checklist | null;
  onSubmit: (values: ChecklistFormValues) => void;
  isPending?: boolean;
}) {
  const form = useForm<ChecklistFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', items: [{ name: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  useEffect(() => {
    if (open) form.reset({
      name: checklist?.name ?? '',
      items: checklist?.items.length ? checklist.items.map((item) => ({ name: item.name })) : [{ name: '' }],
    });
  }, [open, checklist, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-checklist-form">
        <DialogHeader>
          <DialogTitle>{checklist ? 'Editar checklist' : 'Novo checklist'}</DialogTitle>
          <DialogDescription>Defina um nome e todos os itens que deverão ser conferidos na ordem.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do checklist</FormLabel>
                <FormControl><Input {...field} placeholder="Ex: Manutenção preventiva de ar-condicionado" data-testid="input-checklist-name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">Itens a serem verificados</p>
                  <p className="text-xs text-muted-foreground mt-1">Cada item terá situação e foto na ordem de serviço.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '' })} data-testid="button-add-checklist-template-item">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </Button>
              </div>
              {fields.map((field, index) => (
                <FormField key={field.id} control={form.control} name={`items.${index}.name`} render={({ field: input }) => (
                  <FormItem>
                    <div className="flex items-start gap-2">
                      <span className="mt-2.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono shrink-0">{index + 1}</span>
                      <div className="flex-1">
                        <FormControl><Input {...input} placeholder={`Item ${index + 1}`} data-testid={`input-checklist-item-${index}`} /></FormControl>
                        <FormMessage />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={fields.length === 1} onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormItem>
                )} />
              ))}
              {form.formState.errors.items?.root?.message && <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-checklist">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {checklist ? 'Salvar alterações' : 'Criar checklist'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}