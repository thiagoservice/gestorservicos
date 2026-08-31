import { useQueryClient } from '@tanstack/react-query';
import {
  getGetOrderQueryKey,
  getListChecklistsQueryKey,
  getListOrderChecklistItemsQueryKey,
  useApplyChecklistToOrder,
  useCreateChecklist,
  useDeleteChecklist,
  useDeleteOrderChecklistItem,
  useListChecklists,
  useListOrderChecklistItems,
  useUpdateChecklist,
  useUpdateOrderChecklistItem,
} from '@workspace/api-client-react';
import type { ChecklistInput, OrderChecklistItemUpdate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

function errorMessage(error: any) {
  return error?.message ?? 'Tente novamente.';
}

export function useChecklists() {
  return useListChecklists();
}

export function useOrderChecklist(orderId: number | undefined) {
  return useListOrderChecklistItems(orderId as number, {
    query: { enabled: !!orderId, queryKey: getListOrderChecklistItemsQueryKey(orderId as number) },
  });
}

export function useChecklistMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateChecklist();
  const update = useUpdateChecklist();
  const remove = useDeleteChecklist();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListChecklistsQueryKey() });

  return {
    createChecklist: (data: ChecklistInput, onSuccess?: () => void) => create.mutate(
      { data },
      {
        onSuccess: () => { refresh(); toast({ title: 'Checklist cadastrado' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao cadastrar checklist', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    updateChecklist: (id: number, data: ChecklistInput, onSuccess?: () => void) => update.mutate(
      { id, data },
      {
        onSuccess: () => { refresh(); toast({ title: 'Checklist atualizado' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao atualizar checklist', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    deleteChecklist: (id: number) => remove.mutate(
      { id },
      {
        onSuccess: () => { refresh(); toast({ title: 'Checklist removido' }); },
        onError: (error: any) => toast({ title: 'Erro ao remover checklist', description: errorMessage(error), variant: 'destructive' }),
      },
    ),
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}

export function useOrderChecklistMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const apply = useApplyChecklistToOrder();
  const update = useUpdateOrderChecklistItem();
  const remove = useDeleteOrderChecklistItem();
  const refresh = (orderId: number) => queryClient.invalidateQueries({ queryKey: getListOrderChecklistItemsQueryKey(orderId) });

  return {
    applyChecklist: (orderId: number, checklistId: number, onSuccess?: () => void) => apply.mutate(
      { id: orderId, data: { checklistId } },
      {
        onSuccess: () => {
          refresh(orderId);
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          toast({ title: 'Checklist aplicado à ordem' });
          onSuccess?.();
        },
        onError: (error: any) => toast({ title: 'Erro ao aplicar checklist', description: errorMessage(error), variant: 'destructive' }),
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
    isPending: apply.isPending || update.isPending || remove.isPending,
  };
}