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
  unit: z.string().min(1, 'Informe a unidade'),
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
      unit: 'unidade',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: material?.name ?? '',
        description: material?.description ?? '',
        unit: material?.unit ?? 'unidade',
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
            <div>
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
