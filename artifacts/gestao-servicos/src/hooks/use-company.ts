import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCompanyQueryKey,
  useGetCompany,
  useUpdateCompany,
} from '@workspace/api-client-react';
import type { CompanyInput } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function useCompany() {
  return useGetCompany();
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateCompany();

  return {
    ...mutation,
    updateCompany: (data: CompanyInput) => mutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCompanyQueryKey() });
          toast({ title: 'Dados da empresa salvos' });
        },
        onError: (error: any) => toast({
          title: 'Erro ao salvar dados da empresa',
          description: error?.message ?? 'Tente novamente.',
          variant: 'destructive',
        }),
      },
    ),
  };
}