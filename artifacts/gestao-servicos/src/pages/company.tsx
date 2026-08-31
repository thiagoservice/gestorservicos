import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany, useUpdateCompanyMutation } from '@/hooks/use-company';
import { AlertTriangle, Building2, Image, Loader2, Save } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome da empresa'),
  address: z.string().optional(),
  cnpj: z.string().optional(),
  logoUrl: z.string().url('Informe uma URL válida').or(z.literal('')).optional(),
});
type Values = z.infer<typeof schema>;

export default function CompanyPage() {
  const { data: company, isLoading, isError, refetch } = useCompany();
  const { updateCompany, isPending } = useUpdateCompanyMutation();
  const [logoFailed, setLogoFailed] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', address: '', cnpj: '', logoUrl: '' } });
  const logoUrl = form.watch('logoUrl');

  useEffect(() => {
    if (company) form.reset({
      name: company.name,
      address: company.address ?? '',
      cnpj: company.cnpj ?? '',
      logoUrl: company.logoUrl ?? '',
    });
  }, [company, form]);
  useEffect(() => setLogoFailed(false), [logoUrl]);

  if (isLoading) return <AppShell><div className="space-y-4 max-w-3xl"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div></AppShell>;
  if (isError) return <AppShell><Card><CardContent className="p-10 text-center"><AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" /><p className="text-sm text-muted-foreground mb-4">Não foi possível carregar os dados da empresa.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Dados da empresa" description="Informações exibidas no cabeçalho dos laudos e ordens de serviço." actions={
        <Button onClick={form.handleSubmit((values) => updateCompany({
          name: values.name,
          address: values.address || undefined,
          cnpj: values.cnpj || undefined,
          logoUrl: values.logoUrl || undefined,
        }))} disabled={isPending} data-testid="button-save-company">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
        </Button>
      } />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => updateCompany(values))} className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div><h2 className="font-semibold text-primary">Identificação</h2><p className="text-sm text-muted-foreground">Existe apenas um cadastro de empresa neste sistema.</p></div>
            <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome da empresa *</FormLabel><FormControl><Input {...field} placeholder="Ex: Serviços Técnicos Silva" data-testid="input-company-name" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="cnpj" render={({ field }) => <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} placeholder="00.000.000/0000-00" data-testid="input-company-cnpj" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="address" render={({ field }) => <FormItem><FormLabel>Endereço</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Rua, número, bairro, cidade e estado" data-testid="input-company-address" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="logoUrl" render={({ field }) => <FormItem><FormLabel>URL pública do logo</FormLabel><FormControl><Input {...field} type="url" placeholder="https://exemplo.com/logo.png" data-testid="input-company-logo" /></FormControl><p className="text-xs text-muted-foreground">Use um endereço público HTTPS de uma imagem.</p><FormMessage /></FormItem>} />
          </div>
          <div className="rounded-xl border bg-card p-5 h-fit">
            <h2 className="font-semibold mb-1">Prévia do logo</h2>
            <p className="text-xs text-muted-foreground mb-4">Esta imagem aparecerá no laudo.</p>
            <div className="aspect-square rounded-lg border border-dashed bg-muted/30 flex items-center justify-center overflow-hidden">
              {logoUrl && !logoFailed ? <img src={logoUrl} alt="Logo da empresa" className="max-h-full max-w-full object-contain p-4" onError={() => setLogoFailed(true)} /> : <div className="text-center text-muted-foreground"><Image className="h-10 w-10 mx-auto mb-2 opacity-40" /><p className="text-xs">{logoFailed ? 'Não foi possível carregar a imagem' : 'Informe a URL do logo'}</p></div>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-4 w-4" />{form.watch('name') || 'Nome da empresa'}</div>
          </div>
        </form>
      </Form>
    </AppShell>
  );
}