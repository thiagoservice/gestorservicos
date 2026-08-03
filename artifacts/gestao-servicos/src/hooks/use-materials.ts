import { useQueryClient } from '@tanstack/react-query';
import {
  useListMaterials,
  useGetMaterial,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  getListMaterialsQueryKey,
  getGetMaterialQueryKey,
} from '@workspace/api-client-react';
import type {
  MaterialInput,
  MaterialUpdate,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useMaterials() {
  return useListMaterials();
}

export function useMaterial(id: number | undefined) {
  return useGetMaterial(id as number, {
    query: { enabled: !!id, queryKey: getGetMaterialQueryKey(id as number) },
  });
}

export function useCreateMaterialMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useCreateMaterial();

  return {
    ...mutation,
    createMaterial: (data: MaterialInput, onSuccess?: () => void) => {
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
            toast({ title: 'Material cadastrado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao cadastrar material',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useUpdateMaterialMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateMaterial();

  return {
    ...mutation,
    updateMaterial: (
      id: number,
      data: MaterialUpdate,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMaterialQueryKey(id) });
            toast({ title: 'Material atualizado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao atualizar material',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteMaterialMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteMaterial();

  return {
    ...mutation,
    deleteMaterial: (id: number, onSuccess?: () => void) => {
      mutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
            toast({ title: 'Material removido' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao remover material',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}
