import { useQueryClient } from '@tanstack/react-query';
import {
  getListChecklistTemplatesQueryKey,
  getListOrderChecklistItemsQueryKey,
  useCreateChecklistTemplate,
  useCreateOrderChecklistItem,
  useDeleteChecklistTemplate,
  useDeleteOrderChecklistItem,
  useListChecklistTemplates,
  useListOrderChecklistItems,
  useUpdateChecklistTemplate,
  useUpdateOrderChecklistItem,
} from '@workspace/api-client-react';
import type {
  ChecklistTemplateInput,
  OrderChecklistItemUpdate,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

function errorMessage(error: any) {
  return error?.message ?? 'Tente novamente.';
}

export function useChecklistTemplates() {
  return useListChecklistTemplates();
}

export function useOrderChecklist(orderId: number | undefined) {
  return useListOrderChecklistItems(orderId as number, {
    query: { enabled: !!orderId, queryKey: getListOrderChecklistItemsQueryKey(orderId as number) },
  });
}

export function useChecklistTemplateMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateChecklistTemplate();
  const update = useUpdateChecklistTemplate();
  const remove = useDeleteChecklistTemplate();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListChecklistTemplatesQueryKey() });

  return {
    createTemplate: (data: ChecklistTemplateInput, onSuccess?: () => void) => create.mutate(
      { data },
      {
        onSuccess: () => { refresh(); toast({ title: 'Item cadastrado' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao cadastrar item', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    updateTemplate: (id: number, data: ChecklistTemplateInput, onSuccess?: () => void) => update.mutate(
      { id, data },
      {
        onSuccess: () => { refresh(); toast({ title: 'Item atualizado' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao atualizar item', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    deleteTemplate: (id: number) => remove.mutate(
      { id },
      {
        onSuccess: () => { refresh(); toast({ title: 'Item removido do catálogo' }); },
        onError: (error: any) => toast({ title: 'Erro ao remover item', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}

export function useOrderChecklistMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateOrderChecklistItem();
  const update = useUpdateOrderChecklistItem();
  const remove = useDeleteOrderChecklistItem();
  const refresh = (orderId: number) => queryClient.invalidateQueries({ queryKey: getListOrderChecklistItemsQueryKey(orderId) });

  return {
    addItem: (orderId: number, templateId: number, onSuccess?: () => void) => create.mutate(
      { id: orderId, data: { templateId } },
      {
        onSuccess: () => { refresh(orderId); toast({ title: 'Item adicionado ao laudo' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao adicionar item', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    updateItem: (orderId: number, itemId: number, data: OrderChecklistItemUpdate) => update.mutate(
      { id: orderId, itemId, data },
      {
        onSuccess: () => { refresh(orderId); toast({ title: 'Checklist atualizado' }); },
        onError: (error: any) => toast({ title: 'Erro ao atualizar checklist', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    deleteItem: (orderId: number, itemId: number) => remove.mutate(
      { id: orderId, itemId },
      {
        onSuccess: () => { refresh(orderId); toast({ title: 'Item removido do laudo' }); },
        onError: (error: any) => toast({ title: 'Erro ao remover item', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}