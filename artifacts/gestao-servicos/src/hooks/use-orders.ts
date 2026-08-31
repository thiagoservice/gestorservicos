import { useQueryClient } from '@tanstack/react-query';
import {
  useListOrders,
  useGetOrder,
  useListOrderPhotos,
  useAddOrderPhoto,
  useDeleteOrderPhoto,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useAddOrderServiceItem,
  useDeleteOrderServiceItem,
  useAddOrderMaterialItem,
  useDeleteOrderMaterialItem,
  getListOrdersQueryKey,
  getGetOrderQueryKey,
  getListOrderPhotosQueryKey,
  getGetSummaryQueryKey,
} from '@workspace/api-client-react';
import type {
  OrderInput,
  OrderUpdate,
  OrderServiceItemInput,
  OrderMaterialItemInput,
  OrderPhotoInput,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useOrders() {
  return useListOrders();
}

export function useOrder(id: number | undefined) {
  return useGetOrder(id as number, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id as number) },
  });
}

export function useOrderPhotos(id: number | undefined) {
  return useListOrderPhotos(id as number, {
    query: { enabled: !!id, queryKey: getListOrderPhotosQueryKey(id as number) },
  });
}

export function useOrderPhotoMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const add = useAddOrderPhoto();
  const remove = useDeleteOrderPhoto();
  const refresh = (orderId: number) => queryClient.invalidateQueries({ queryKey: getListOrderPhotosQueryKey(orderId) });

  return {
    addPhoto: (orderId: number, data: OrderPhotoInput, onSuccess?: () => void) => add.mutate(
      { id: orderId, data },
      {
        onSuccess: () => { refresh(orderId); toast({ title: 'Foto adicionada à ordem' }); onSuccess?.(); },
        onError: (error: any) => toast({ title: 'Erro ao adicionar foto', description: error?.message ?? 'Informe uma URL pública válida.', variant: 'destructive' }),
      },
    ),
    deletePhoto: (orderId: number, photoId: number) => remove.mutate(
      { id: orderId, photoId },
      {
        onSuccess: () => { refresh(orderId); toast({ title: 'Foto removida da ordem' }); },
        onError: (error: any) => toast({ title: 'Erro ao remover foto', description: error?.message ?? 'Tente novamente.', variant: 'destructive' }),
      },
    ),
    isPending: add.isPending || remove.isPending,
  };
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useCreateOrder();

  return {
    ...mutation,
    createOrder: (data: OrderInput, onSuccess?: (order: any) => void) => {
      mutation.mutate(
        { data },
        {
          onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Ordem de serviço criada com sucesso' });
            onSuccess?.(order);
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao criar ordem de serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateOrder();

  return {
    ...mutation,
    updateOrder: (
      id: number,
      data: OrderUpdate,
      onSuccess?: () => void,
      opts?: { silent?: boolean },
    ) => {
      mutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            if (!opts?.silent) {
              toast({ title: 'Ordem de serviço atualizada' });
            }
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao atualizar ordem de serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteOrder();

  return {
    ...mutation,
    deleteOrder: (id: number, onSuccess?: () => void) => {
      mutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Ordem de serviço removida' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao remover ordem de serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useAddOrderServiceItemMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useAddOrderServiceItem();

  return {
    ...mutation,
    addServiceItem: (
      orderId: number,
      data: OrderServiceItemInput,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id: orderId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Serviço adicionado à ordem' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao adicionar serviço',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteOrderServiceItemMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteOrderServiceItem();

  return {
    ...mutation,
    deleteServiceItem: (
      orderId: number,
      itemId: number,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id: orderId, itemId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Serviço removido da ordem' });
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

export function useAddOrderMaterialItemMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useAddOrderMaterialItem();

  return {
    ...mutation,
    addMaterialItem: (
      orderId: number,
      data: OrderMaterialItemInput,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id: orderId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Material adicionado à ordem' });
            onSuccess?.();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro ao adicionar material',
              description: error?.message ?? 'Tente novamente.',
              variant: 'destructive',
            });
          },
        },
      );
    },
  };
}

export function useDeleteOrderMaterialItemMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useDeleteOrderMaterialItem();

  return {
    ...mutation,
    deleteMaterialItem: (
      orderId: number,
      itemId: number,
      onSuccess?: () => void,
    ) => {
      mutation.mutate(
        { id: orderId, itemId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
            toast({ title: 'Material removido da ordem' });
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
