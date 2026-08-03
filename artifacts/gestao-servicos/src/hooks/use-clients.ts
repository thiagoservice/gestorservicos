import { useQueryClient } from '@tanstack/react-query';
import {
  useListClients,
  useGetClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  getListClientsQueryKey,
  getGetClientQueryKey,
} from '@workspace/api-client-react';
import type { ClientInput, ClientUpdate } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useClients() {
  return useListClients();
}

export function useClient(id: number | undefined) {
  return useGetClient(id as number, {
    query: { enabled: !!id, queryKey: getGetClientQueryKey(id as number) },
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useCreateClient();

  return {
    ...mutation,
    createClient: (data: ClientInput, onSuccess?: () => void) => {
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            toast({ title: 'Cliente cadastrado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao cadastrar cliente',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateClient();

  return {
    ...mutation,
    updateClient: (
      id: number,
      data: ClientUpdate,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
            toast({ title: 'Cliente atualizado com sucesso' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao atualizar cliente',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteClient();

  return {
    ...mutation,
    deleteClient: (id: number, onSuccess?: () => void) => {
      mutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            toast({ title: 'Cliente removido' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao remover cliente',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}
