import { useState } from 'react';
import type { Checklist } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ChecklistFormDialog, type ChecklistFormValues } from '@/components/checklist-form-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useChecklistMutations, useChecklists } from '@/hooks/use-checklists';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';

export default function ChecklistsPage() {
  const { data: checklists, isLoading, isError, refetch } = useChecklists();
  const { createChecklist, updateChecklist, deleteChecklist, isPending } = useChecklistMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const startCreate = () => { setEditing(null); setOpen(true); };
  const submit = (values: ChecklistFormValues) => {
    const data = { name: values.name, items: values.items.map((item) => item.name) };
    const done = () => setOpen(false);
    editing ? updateChecklist(editing.id, data, done) : createChecklist(data, done);
  };

  return (
    <AppShell>
      <PageHeader
        title="Checklists"
        description="Crie modelos com todos os itens que deverão ser conferidos durante o serviço."
        actions={<Button onClick={startCreate} data-testid="button-new-checklist"><Plus className="h-4 w-4" />Novo checklist</Button>}
      />
      {isLoading ? <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}</div>
        : isError ? <Card><CardContent className="p-8 text-center"><AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" /><p className="text-sm text-muted-foreground mb-4">Não foi possível carregar os checklists.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card>
        : !checklists?.length ? <Empty className="border rounded-xl bg-card"><EmptyHeader><EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia><EmptyTitle>Nenhum checklist cadastrado</EmptyTitle><EmptyDescription>Crie um checklist e adicione os itens que serão marcados nas ordens.</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={startCreate}><Plus className="h-4 w-4" />Criar checklist</Button></EmptyContent></Empty>
        : <div className="grid md:grid-cols-2 gap-4">{checklists.map((checklist) => (
          <Card key={checklist.id} className="overflow-hidden" data-testid={`card-checklist-${checklist.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-semibold text-lg">{checklist.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{checklist.items.length} {checklist.items.length === 1 ? 'item' : 'itens'} para verificar</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(checklist); setOpen(true); }} data-testid={`button-edit-checklist-${checklist.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                  <ConfirmDeleteDialog trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>} title="Excluir checklist" description={`Excluir "${checklist.name}"? Os itens já aplicados às ordens serão mantidos.`} onConfirm={() => deleteChecklist(checklist.id)} isPending={isPending} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                {checklist.items.slice(0, 5).map((item) => <div key={item.id} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span>{item.name}</span></div>)}
                {checklist.items.length > 5 && <p className="text-xs text-muted-foreground pl-6">+ {checklist.items.length - 5} itens</p>}
              </div>
            </CardContent>
          </Card>
        ))}</div>}
      <ChecklistFormDialog open={open} onOpenChange={setOpen} checklist={editing} onSubmit={submit} isPending={isPending} />
    </AppShell>
  );
}