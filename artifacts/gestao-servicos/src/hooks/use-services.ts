import { useQueryClient } from '@tanstack/react-query';
import {
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  getListServicesQueryKey,
  getGetServiceQueryKey,
} from '@workspace/api-client-react';
import type { ServiceInput, ServiceUpdate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useServices() {
  return useListServices();
}

export function useCreateServiceMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useCreateService();

  return {
    ...mutation,
    createService: (data: ServiceInput, onSuccess?: () => void) => {
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
            toast({ title: 'Serviço cadastrado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao cadastrar serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateService();

  return {
    ...mutation,
    updateService: (id: number, data: ServiceUpdate, onSuccess?: () => void) => {
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetServiceQueryKey(id) });
            toast({ title: 'Serviço atualizado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao atualizar serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteService();

  return {
    ...mutation,
    deleteService: (id: number, onSuccess?: () => void) => {
      mutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
            toast({ title: 'Serviço removido' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao remover serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}
