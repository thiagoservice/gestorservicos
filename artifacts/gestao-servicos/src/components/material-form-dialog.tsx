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
import type { Material } from '@workspace/api-client-react';

const materialSchema = z.object({
  name: z.string().min(1, 'Informe o nome do material'),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Preço deve ser positivo'),
  unit: z.string().min(1, 'Informe a unidade'),
  stockQuantity: z.coerce.number().min(0, 'Estoque deve ser positivo'),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  onSubmit: (values: MaterialFormValues) => void;
  isPending?: boolean;
}) {
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: 0,
      unit: 'unidade',
      stockQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: material?.name ?? '',
        description: material?.description ?? '',
        unitPrice: material?.unitPrice ?? 0,
        unit: material?.unit ?? 'unidade',
        stockQuantity: material?.stockQuantity ?? 0,
      });
    }
  }, [open, material, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-material-form">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Editar material' : 'Novo material'}
          </DialogTitle>
          <DialogDescription>
            {material
              ? 'Atualize as informações do material em estoque.'
              : 'Cadastre um material para controlar o estoque e usar nas ordens.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="form-material"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cabo flexível 2,5mm"
                      data-testid="input-material-name"
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
                      placeholder="Detalhes sobre o material"
                      rows={3}
                      data-testid="input-material-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        data-testid="input-material-price"
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
                        placeholder="m, kg, unidade..."
                        data-testid="input-material-unit"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        data-testid="input-material-stock"
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
                data-testid="button-cancel-material"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-material"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {material ? 'Salvar alterações' : 'Cadastrar material'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
