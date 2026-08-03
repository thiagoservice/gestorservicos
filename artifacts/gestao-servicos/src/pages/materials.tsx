import { useLocation } from 'wouter';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '@/components/ui/empty';
import {
  useMaterials,
  useDeleteMaterialMutation,
} from '@/hooks/use-materials';
import { formatCurrencyBRL } from '@/lib/format';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 5;

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const { data: materials, isLoading, isError, refetch } = useMaterials();
  const { deleteMaterial, isPending: isDeleting } = useDeleteMaterialMutation();

  return (
    <AppShell>
      <PageHeader
        title="Materiais e estoque"
        description="Controle de materiais usados nas ordens de serviço."
        actions={
          <Button onClick={() => setLocation('/materiais/novo')} data-testid="button-new-material">
            <Plus className="h-4 w-4" />
            Novo material
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar os materiais.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-materials">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : !materials || materials.length === 0 ? (
        <Empty className="border rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package /></EmptyMedia>
            <EmptyTitle>Nenhum material cadastrado</EmptyTitle>
            <EmptyDescription>
              Cadastre os materiais que sua empresa utiliza para acompanhar o estoque.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setLocation('/materiais/novo')} data-testid="button-empty-new-material">
              <Plus className="h-4 w-4" />
              Cadastrar material
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="overflow-hidden animate-fade-up">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="w-[96px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const lowStock = material.stockQuantity <= LOW_STOCK_THRESHOLD;
                return (
                  <TableRow
                    key={material.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setLocation(`/materiais/${material.id}`)}
                    data-testid={`row-material-${material.id}`}
                  >
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                      {material.description || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn('font-mono font-medium', lowStock && 'text-destructive')}
                        data-testid={`text-stock-${material.id}`}
                      >
                        {material.stockQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrencyBRL(material.unitPrice)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setLocation(`/materiais/${material.id}`)}
                          data-testid={`button-edit-material-${material.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmDeleteDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-testid={`button-delete-material-${material.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                          title="Excluir material"
                          description={`Tem certeza que deseja excluir "${material.name}" do estoque?`}
                          onConfirm={() => deleteMaterial(material.id)}
                          isPending={isDeleting}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
