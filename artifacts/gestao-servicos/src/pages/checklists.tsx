import { useState } from 'react';
import type { ChecklistTemplate } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ChecklistFormDialog, type ChecklistFormValues } from '@/components/checklist-form-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useChecklistTemplateMutations, useChecklistTemplates } from '@/hooks/use-checklists';
import { AlertTriangle, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';

export default function ChecklistsPage() {
  const { data: items, isLoading, isError, refetch } = useChecklistTemplates();
  const { createTemplate, updateTemplate, deleteTemplate, isPending } = useChecklistTemplateMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);
  const startCreate = () => { setEditing(null); setOpen(true); };
  const submit = (values: ChecklistFormValues) => {
    const done = () => setOpen(false);
    editing ? updateTemplate(editing.id, values, done) : createTemplate(values, done);
  };

  return (
    <AppShell>
      <PageHeader title="Modelos de checklist" description="Cadastre os itens que poderão ser aplicados às ordens de serviço." actions={<Button onClick={startCreate} data-testid="button-new-checklist"><Plus className="h-4 w-4" />Novo item</Button>} />
      {isLoading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        : isError ? <Card><CardContent className="p-8 text-center"><AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" /><p className="text-sm text-muted-foreground mb-4">Não foi possível carregar o checklist.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card>
        : !items?.length ? <Empty className="border rounded-xl bg-card"><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>Nenhum item cadastrado</EmptyTitle><EmptyDescription>Crie o primeiro item para começar a montar seus laudos.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={startCreate}><Plus className="h-4 w-4" />Cadastrar item</Button></EmptyContent></Empty>
        : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Item do checklist</TableHead><TableHead className="w-[96px] text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id} data-testid={`row-checklist-${item.id}`}><TableCell className="font-medium">{item.name}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setOpen(true); }} data-testid={`button-edit-checklist-${item.id}`}><Pencil className="h-3.5 w-3.5" /></Button><ConfirmDeleteDialog trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>} title="Excluir item" description={`Excluir "${item.name}" do catálogo? Itens já aplicados às ordens serão mantidos.`} onConfirm={() => deleteTemplate(item.id)} isPending={isPending} /></div></TableCell></TableRow>)}</TableBody></Table></Card>}
      <ChecklistFormDialog open={open} onOpenChange={setOpen} item={editing} onSubmit={submit} isPending={isPending} />
    </AppShell>
  );
}