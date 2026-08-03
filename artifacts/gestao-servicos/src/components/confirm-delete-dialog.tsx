import { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
  isPending,
  testId,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  isPending?: boolean;
  testId?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent data-testid={testId ?? 'dialog-confirm-delete'}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="button-confirm-delete"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground border-destructive-border hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
