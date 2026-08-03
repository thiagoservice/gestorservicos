import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Hammer } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm animate-fade-up">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Hammer className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild data-testid="button-back-home">
          <Link href="/">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  );
}
