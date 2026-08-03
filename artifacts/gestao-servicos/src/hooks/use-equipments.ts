import { useQueryClient } from '@tanstack/react-query';
import {
  useListEquipments,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  getListEquipmentsQueryKey,
} from '@workspace/api-client-react';
import type { EquipmentInput, EquipmentUpdate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useEquipments(clientId: number | undefined) {
  return useListEquipments(clientId as number, {
    query: {
      enabled: !!clientId,
      queryKey: getListEquipmentsQueryKey(clientId as number),
    },
  });
}

export function useCreateEquipmentMutation(clientId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useCreateEquipment();

  return {
    ...mutation,
    createEquipment: (data: EquipmentInput, onSuccess?: () => void) => {
      mutation.mutate(
        { id: clientId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEquipmentsQueryKey(clientId) });
            toast({ title: 'Equipamento cadastrado' });
            onSuccess?.();
          },
          onError: () => toast({ title: 'Erro ao cadastrar equipamento', variant: 'destructive' }),
        },
      );
    },
  };
}

export function useUpdateEquipmentMutation(clientId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateEquipment();

  return {
    ...mutation,
    updateEquipment: (equipId: number, data: EquipmentUpdate, onSuccess?: () => void) => {
      mutation.mutate(
        { id: clientId, equipId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEquipmentsQueryKey(clientId) });
            toast({ title: 'Equipamento atualizado' });
            onSuccess?.();
          },
          onError: () => toast({ title: 'Erro ao atualizar equipamento', variant: 'destructive' }),
        },
      );
    },
  };
}

export function useDeleteEquipmentMutation(clientId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteEquipment();

  return {
    ...mutation,
    deleteEquipment: (equipId: number, onSuccess?: () => void) => {
      mutation.mutate(
        { id: clientId, equipId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListEquipmentsQueryKey(clientId) });
            toast({ title: 'Equipamento removido' });
            onSuccess?.();
          },
          onError: () => toast({ title: 'Erro ao remover equipamento', variant: 'destructive' }),
        },
      );
    },
  };
}
