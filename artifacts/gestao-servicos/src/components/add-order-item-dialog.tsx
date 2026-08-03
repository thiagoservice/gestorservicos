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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
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
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedId('');
      setQuantity('1');
      setUnitPrice('');
    }
  }, [open]);

  const selected = items.find((i) => String(i.id) === selectedId);
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
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger data-testid="select-order-item">
                <SelectValue placeholder="Selecione um item" />
              </SelectTrigger>
              <SelectContent>
                {items.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    {emptyLabel}
                  </div>
                ) : (
                  items.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={String(item.id)}
                      data-testid={`option-order-item-${item.id}`}
                    >
                      {item.name} — {item.unit}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
