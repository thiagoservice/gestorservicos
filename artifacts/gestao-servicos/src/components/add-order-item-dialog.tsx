import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/format';

type CatalogItem = {
  id: number;
  name: string;
  unit: string;
};

export function AddOrderItemDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  emptyLabel,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: CatalogItem[];
  emptyLabel: string;
  onSubmit: (itemId: number, quantity: number, unitPrice: number) => void;
  isPending?: boolean;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedId('');
      setSearchTerm('');
      setQuantity('1');
      setUnitPrice('');
    }
  }, [open]);

  const selected = items.find((i) => String(i.id) === selectedId);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const filteredItems = normalizedSearch
    ? items.filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : items;
  const qtyNum = Number(quantity) || 0;
  const priceNum = Number(unitPrice) || 0;
  const total = priceNum * qtyNum;
  const canSubmit = !!selectedId && qtyNum > 0 && priceNum >= 0 && unitPrice !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(Number(selectedId), qtyNum, priceNum);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-order-item">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Item do catálogo</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Pesquisar por nome..."
                className="pl-9"
                autoComplete="off"
                data-testid="input-search-order-item"
              />
            </div>
            <div
              className="max-h-48 overflow-y-scroll overscroll-contain rounded-md border bg-background sm:max-h-56"
              role="group"
              aria-label="Itens do catálogo"
              data-testid="list-order-items"
            >
              {filteredItems.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {items.length === 0 ? emptyLabel : 'Nenhum item encontrado.'}
                </p>
              ) : filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(String(item.id))}
                  aria-pressed={selectedId === String(item.id)}
                  className={`block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary ${
                    selectedId === String(item.id) ? 'bg-primary/10 font-medium text-primary' : ''
                  }`}
                  data-testid={`option-order-item-${item.id}`}
                >
                  {item.name} — {item.unit}
                </button>
              ))}
            </div>
            {selected && <p className="text-xs text-muted-foreground">Selecionado: {selected.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preço unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                data-testid="input-order-item-price"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade{selected ? ` (${selected.unit})` : ''}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                data-testid="input-order-item-quantity"
              />
            </div>
          </div>

          {selected && unitPrice !== '' && (
            <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-mono font-semibold" data-testid="text-order-item-subtotal">
                {formatCurrencyBRL(total)}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-order-item"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isPending || !canSubmit}
            onClick={handleSubmit}
            data-testid="button-save-order-item"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
