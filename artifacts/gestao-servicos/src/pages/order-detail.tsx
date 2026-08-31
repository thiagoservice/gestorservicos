import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { AddOrderItemDialog } from '@/components/add-order-item-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useOrder,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useAddOrderServiceItemMutation,
  useDeleteOrderServiceItemMutation,
  useAddOrderMaterialItemMutation,
  useDeleteOrderMaterialItemMutation,
  useOrderPhotos,
  useOrderPhotoMutations,
} from '@/hooks/use-orders';
import { useClients } from '@/hooks/use-clients';
import { useServices } from '@/hooks/use-services';
import { useMaterials } from '@/hooks/use-materials';
import { useCompany } from '@/hooks/use-company';
import { getStoredImageUrl, useImageUpload } from '@/hooks/use-image-upload';
import { useToast } from '@/hooks/use-toast';
import {
  useChecklists,
  useOrderChecklist,
  useOrderChecklistMutations,
} from '@/hooks/use-checklists';
import { formatCurrencyBRL, formatDateTimeBR, ORDER_STATUS_OPTIONS } from '@/lib/format';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Wrench,
  Package,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Wallet,
  Save,
  Loader2,
  Building2,
  ClipboardCheck,
  FileDown,
  ImagePlus,
} from 'lucide-react';

const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
  nao_se_aplica: 'Não se aplica',
};

/* ─── form schema ─── */
const orderSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  address: z.string().optional(),
  title: z.string().min(1, 'Informe o título da ordem'),
  description: z.string().optional(),
});
type OrderFormValues = z.infer<typeof orderSchema>;

/* ─── draft item types ─── */
type DraftServiceItem = { tempId: number; serviceId: number; serviceName: string; unit: string; quantity: number; unitPrice: number; totalPrice: number };
type DraftMaterialItem = { tempId: number; materialId: number; materialName: string; unit: string; quantity: number; unitPrice: number; totalPrice: number };

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'novo';
  const orderId = isNew ? undefined : Number(params.id);
  const [, setLocation] = useLocation();

  /* ─── data ─── */
  const { data: order, isLoading, isError, refetch } = useOrder(orderId);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: services } = useServices();
  const { data: materials } = useMaterials();
  const { data: company } = useCompany();
  const { data: checklists } = useChecklists();
  const { data: checklistItems } = useOrderChecklist(orderId);
  const { data: orderPhotos } = useOrderPhotos(orderId);
  const { uploadImage, isUploading: isPhotoUploading } = useImageUpload();
  const { toast } = useToast();

  /* ─── mutations ─── */
  const { createOrder, isPending: isCreating } = useCreateOrderMutation();
  const { updateOrder, isPending: isStatusUpdating } = useUpdateOrderMutation();
  const { deleteOrder, isPending: isDeletingOrder } = useDeleteOrderMutation();
  const { addServiceItem, isPending: isAddingService } = useAddOrderServiceItemMutation();
  const { deleteServiceItem } = useDeleteOrderServiceItemMutation();
  const { addMaterialItem, isPending: isAddingMaterial } = useAddOrderMaterialItemMutation();
  const { deleteMaterialItem } = useDeleteOrderMaterialItemMutation();
  const { addPhoto, deletePhoto, isPending: isPhotoPending } = useOrderPhotoMutations();
  const { applyChecklist, removeChecklist, updateItem: updateChecklistItem, deleteItem: deleteChecklistItem, isPending: isChecklistPending } = useOrderChecklistMutations();

  /* ─── dialogs ─── */
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const [selectedChecklistId, setSelectedChecklistId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoCaptionDraft, setPhotoCaptionDraft] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  /* ─── print helper: embeds authenticated images as base64 before printing ─── */
  const handlePrint = async () => {
    setIsPrinting(true);
    const imgs = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        '.print-document img[src^="/api/storage/objects/"], .print-document img[src^="/api/storage/public-objects/"]',
      ),
    );
    const originals = new Map<HTMLImageElement, string>();
    await Promise.all(
      imgs.map(async (img) => {
        try {
          const res = await fetch(img.src, { credentials: 'include' });
          if (!res.ok) return;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          originals.set(img, img.src);
          img.src = dataUrl;
        } catch {
          /* ignore single-image errors; others will still print */
        }
      }),
    );
    window.print();
    // restore originals so the page stays interactive after printing
    originals.forEach((src, img) => { img.src = src; });
    setIsPrinting(false);
  };

  /* ─── draft items (novo mode only) ─── */
  const [draftServices, setDraftServices] = useState<DraftServiceItem[]>([]);
  const [draftMaterials, setDraftMaterials] = useState<DraftMaterialItem[]>([]);
  const [nextTempId, setNextTempId] = useState(1);

  /* ─── form ─── */
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { clientId: '', address: '', title: '', description: '' },
  });

  useEffect(() => {
    if (order) {
      setAddressDraft(order.address ?? '');
      setSelectedChecklistId(order.checklistId ? String(order.checklistId) : '');
      form.reset({
        clientId: String(order.clientId),
        address: order.address ?? '',
        title: order.title,
        description: order.description ?? '',
      });
    }
  }, [order, form]);

  /* ─── create handler ─── */
  const handleCreate = async (values: OrderFormValues) => {
    createOrder(
      {
        clientId: Number(values.clientId),
        address: values.address || undefined,
        title: values.title,
        description: values.description || undefined,
      },
      async (created) => {
        // post all draft items sequentially
        for (const s of draftServices) {
          await new Promise<void>((resolve) => {
            addServiceItem(created.id, { serviceId: s.serviceId, quantity: s.quantity, unitPrice: s.unitPrice }, resolve);
          });
        }
        for (const m of draftMaterials) {
          await new Promise<void>((resolve) => {
            addMaterialItem(created.id, { materialId: m.materialId, quantity: m.quantity, unitPrice: m.unitPrice }, resolve);
          });
        }
        setLocation(`/ordens/${created.id}`);
      },
    );
  };

  /* ─── draft item helpers ─── */
  const addDraftService = (serviceId: number, quantity: number, unitPrice: number) => {
    const svc = (services ?? []).find((s) => s.id === serviceId);
    if (!svc) return;
    setDraftServices((prev) => [
      ...prev,
      { tempId: nextTempId, serviceId, serviceName: svc.name, unit: svc.unit, quantity, unitPrice, totalPrice: quantity * unitPrice },
    ]);
    setNextTempId((n) => n + 1);
    setServiceDialogOpen(false);
  };

  const addDraftMaterial = (materialId: number, quantity: number, unitPrice: number) => {
    const mat = (materials ?? []).find((m) => m.id === materialId);
    if (!mat) return;
    setDraftMaterials((prev) => [
      ...prev,
      { tempId: nextTempId, materialId, materialName: mat.name, unit: mat.unit, quantity, unitPrice, totalPrice: quantity * unitPrice },
    ]);
    setNextTempId((n) => n + 1);
    setMaterialDialogOpen(false);
  };

  const draftTotal =
    draftServices.reduce((s, i) => s + i.totalPrice, 0) +
    draftMaterials.reduce((s, i) => s + i.totalPrice, 0);

  /* ─── loading / error ─── */
  if (!isNew && isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!isNew && (isError || !order)) {
    return (
      <AppShell>
        <Card>
          <CardContent className="p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível carregar essa ordem de serviço.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
              <Button size="sm" onClick={() => setLocation('/ordens')}>Voltar para ordens</Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  /* ══════════════════════════════════════════════════════
     NEW ORDER MODE
  ══════════════════════════════════════════════════════ */
  if (isNew) {
    return (
      <AppShell>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/ordens">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nova ordem de serviço</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Preencha os dados e adicione serviços e materiais antes de criar.
              </p>
            </div>
          </div>
          <Button
            onClick={form.handleSubmit(handleCreate)}
            disabled={isCreating}
            data-testid="button-save-order"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Criar ordem
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5">

            {/* Dados básicos */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold text-primary mb-1">Dados da Ordem</h2>
              <p className="text-sm text-muted-foreground mb-4">Informações principais da ordem de serviço.</p>
              <div className="space-y-4 max-w-2xl">
                <FormField control={form.control} name="clientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      {clientsLoading ? <Skeleton className="h-9 w-full" /> : (
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          data-testid="select-order-client"
                        >
                          <option value="">Selecione um cliente</option>
                          {(clients ?? []).map((c) => (
                            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                          ))}
                        </select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço do atendimento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Rua das Flores, 123 — Bairro"
                        {...field}
                        data-testid="input-order-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Reforma elétrica completa" {...field} data-testid="input-order-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o serviço, observações importantes, local de atendimento..."
                        rows={3}
                        {...field}
                        data-testid="textarea-order-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Total preview */}
            {draftTotal > 0 && (
              <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor previsto</p>
                  <p className="font-display font-bold tracking-tight">{formatCurrencyBRL(draftTotal)}</p>
                </div>
              </div>
            )}

            {/* Serviços */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Serviços
                  {draftServices.length > 0 && (
                    <Badge variant="secondary" className="ml-1 font-mono text-[10px]">{draftServices.length}</Badge>
                  )}
                </h2>
                <Button size="sm" variant="outline" type="button" onClick={() => setServiceDialogOpen(true)} data-testid="button-add-service-item">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>

              {draftServices.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">Nenhum serviço adicionado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftServices.map((item) => (
                      <TableRow key={item.tempId}>
                        <TableCell className="text-sm">{item.serviceName}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm font-mono font-medium">{formatCurrencyBRL(item.totalPrice)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" type="button"
                            onClick={() => setDraftServices((p) => p.filter((s) => s.tempId !== item.tempId))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Materiais */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  Materiais
                  {draftMaterials.length > 0 && (
                    <Badge variant="secondary" className="ml-1 font-mono text-[10px]">{draftMaterials.length}</Badge>
                  )}
                </h2>
                <Button size="sm" variant="outline" type="button" onClick={() => setMaterialDialogOpen(true)} data-testid="button-add-material-item">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>

              {draftMaterials.length === 0 ? (
                <div className="py-8 text-center border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftMaterials.map((item) => (
                      <TableRow key={item.tempId}>
                        <TableCell className="text-sm">{item.materialName}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm font-mono font-medium">{formatCurrencyBRL(item.totalPrice)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" type="button"
                            onClick={() => setDraftMaterials((p) => p.filter((m) => m.tempId !== item.tempId))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

          </form>
        </Form>

        {/* Dialogs */}
        <AddOrderItemDialog
          open={serviceDialogOpen}
          onOpenChange={setServiceDialogOpen}
          title="Adicionar serviço"
          description="Escolha um serviço do catálogo e informe quantidade e preço."
          items={services ?? []}
          emptyLabel="Cadastre um serviço no catálogo primeiro"
          onSubmit={addDraftService}
        />
        <AddOrderItemDialog
          open={materialDialogOpen}
          onOpenChange={setMaterialDialogOpen}
          title="Adicionar material"
          description="Escolha um material e informe quantidade e preço."
          items={materials ?? []}
          emptyLabel="Cadastre um material no catálogo primeiro"
          onSubmit={addDraftMaterial}
        />
      </AppShell>
    );
  }

  /* ══════════════════════════════════════════════════════
     EXISTING ORDER MODE
  ══════════════════════════════════════════════════════ */
  /* ─── print document (hidden on screen, shown only when printing) ─── */
  const PrintDocument = () => {
    const border = '#cccccc';
    const thBg = '#f2f2f2';
    const altRow = '#f9f9f9';
    const labelColor = '#111827';
    const mutedColor = '#555555';

    /* "31 de agosto de 2026 às 18:03" */
    const formatDateLong = (value: string | null | undefined): string => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()} às ${h}:${m}`;
    };

    const numPadded = String(order!.number).padStart(10, '0');
    const orderStatusLabel = ORDER_STATUS_OPTIONS.find((o) => o.value === order!.status)?.label ?? order!.status;

    /* checklist grouping */
    const templateToChecklistId = new Map<number, number>();
    for (const cl of checklists ?? [])
      for (const tmpl of cl.items) templateToChecklistId.set(tmpl.id, cl.id);
    const checklistMap = new Map((checklists ?? []).map((c) => [c.id, c.name]));
    const groups = new Map<number, NonNullable<typeof checklistItems>>();
    for (const item of checklistItems ?? []) {
      const key = item.checklistId ?? (item.templateId != null ? (templateToChecklistId.get(item.templateId) ?? 0) : 0);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const statusLabel: Record<string, string> = { conforme: 'Conforme', nao_conforme: 'Não conforme', nao_se_aplica: 'N/A' };
    const statusColor: Record<string, string> = { conforme: '#15803d', nao_conforme: '#b91c1c', nao_se_aplica: '#555555' };

    /* section counter */
    let sec = 0;
    const nextSec = () => { sec += 1; return sec; };

    /* shared styles */
    const sectionTitle = (n: number, title: string) => (
      <div style={{ borderBottom: `1.5px solid ${border}`, paddingBottom: '4px', marginBottom: '10px', marginTop: sec === 1 ? 0 : '16px' }}>
        <span style={{ fontWeight: 700, fontSize: '11pt', color: labelColor }}>{n}. {title}</span>
      </div>
    );
    const thStyle: React.CSSProperties = { backgroundColor: thBg, border: `1px solid ${border}`, padding: '5px 8px', fontWeight: 700, fontSize: '9pt', textAlign: 'left' };
    const tdStyle: React.CSSProperties = { border: `1px solid ${border}`, padding: '5px 8px', fontSize: '9pt' };
    const tdNum: React.CSSProperties = { ...tdStyle, textAlign: 'center', width: '40px', color: mutedColor };
    const Field = ({ label, value }: { label: string; value?: string | null }) => (
      <div style={{ marginBottom: '4px' }}>
        <span style={{ fontWeight: 700 }}>{label}:</span>{' '}
        <span>{value || '—'}</span>
      </div>
    );

    return (
      <div className="print-document" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9.5pt', color: labelColor, lineHeight: 1.45 }}>

        {/* ── CABEÇALHO: logo + dados da empresa ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1.5px solid ${border}`, paddingBottom: '10px', marginBottom: '14px' }}>
          {company?.logoUrl
            ? <img src={getStoredImageUrl(company.logoUrl)} alt="Logo" style={{ height: '48px', maxWidth: '80px', objectFit: 'contain', flexShrink: 0 }} />
            : <div style={{ width: '48px', height: '48px', backgroundColor: '#f2f2f2', border: `1px solid ${border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7pt', color: '#aaa' }}>LOGO</div>
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: '13pt' }}>{company?.name || 'Nome da empresa'}</div>
            {company?.cnpj && <div style={{ fontSize: '8.5pt', color: mutedColor }}>CNPJ: {company.cnpj}</div>}
            {company?.address && <div style={{ fontSize: '8.5pt', color: mutedColor }}>{company.address}</div>}
          </div>
        </div>

        {/* ── TÍTULO CENTRALIZADO ── */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ fontWeight: 700, fontSize: '16pt', letterSpacing: '0.03em' }}>ORDEM DE SERVIÇO</div>
          <div style={{ fontSize: '11pt', marginTop: '3px' }}>Nº {numPadded}</div>
          <div style={{ fontSize: '8.5pt', color: mutedColor, marginTop: '3px' }}>
            Gerado em {formatDateLong(order!.createdAt)}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '10px 0 14px' }} />

        {/* ─────────────────────────────────────
            1. INFORMAÇÕES GERAIS
        ───────────────────────────────────── */}
        {sectionTitle(nextSec(), 'DADOS DO CLIENTE')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: '4px' }}>
          <Field label="Status" value={orderStatusLabel} />
          <Field label="Data de criação" value={formatDateTimeBR(order!.createdAt)} />
          <Field label="Cliente" value={order!.clientName} />
          <Field label="Local do atendimento" value={order!.address} />
        </div>

        {/* ─────────────────────────────────────
            2. DESCRIÇÃO DO SERVIÇO
        ───────────────────────────────────── */}
        {(() => { const n = nextSec(); return (
          <>
            {sectionTitle(n, 'DESCRIÇÃO DO SERVIÇO')}
            <div style={{ border: `1px solid ${border}`, padding: '8px 10px', minHeight: '40px', fontSize: '9.5pt', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>
              {order!.description || '—'}
            </div>
          </>
        ); })()}

        {/* ─────────────────────────────────────
            3. SERVIÇOS EXECUTADOS
        ───────────────────────────────────── */}
        {order!.serviceItems.length > 0 && (() => { const n = nextSec(); return (
          <>
            {sectionTitle(n, 'SERVIÇOS EXECUTADOS')}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
                  <th style={thStyle}>Descrição</th>
                  <th style={{ ...thStyle, width: '55px', textAlign: 'center' }}>Qtd.</th>
                  <th style={{ ...thStyle, width: '90px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order!.serviceItems.map((item, i) => (
                  <tr key={item.id} style={{ backgroundColor: i % 2 === 1 ? altRow : 'white' }}>
                    <td style={tdNum}>{i + 1}</td>
                    <td style={tdStyle}>{item.serviceName}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrencyBRL(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ); })()}

        {/* ─────────────────────────────────────
            4. MATERIAIS UTILIZADOS
        ───────────────────────────────────── */}
        {order!.materialItems.length > 0 && (() => { const n = nextSec(); return (
          <>
            {sectionTitle(n, 'MATERIAIS UTILIZADOS')}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
                  <th style={thStyle}>Material</th>
                  <th style={{ ...thStyle, width: '55px', textAlign: 'center' }}>Qtd.</th>
                  <th style={{ ...thStyle, width: '90px', textAlign: 'right' }}>Valor Unit.</th>
                  <th style={{ ...thStyle, width: '90px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order!.materialItems.map((item, i) => (
                  <tr key={item.id} style={{ backgroundColor: i % 2 === 1 ? altRow : 'white' }}>
                    <td style={tdNum}>{i + 1}</td>
                    <td style={tdStyle}>{item.materialName}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrencyBRL(item.unitPrice)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrencyBRL(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: thBg }}>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>TOTAL GERAL</td>
                  <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>{formatCurrencyBRL(order!.totalPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        ); })()}

        {/* ─────────────────────────────────────
            CHECKLISTS (uma seção por grupo)
        ───────────────────────────────────── */}
        {groups.size > 0 && Array.from(groups.entries()).map(([gid, items]) => {
          const n = nextSec();
          const name = gid ? (checklistMap.get(gid) ?? 'Checklist') : 'Itens avulsos';
          return (
            <div key={gid}>
              {sectionTitle(n, `CHECKLIST — ${name.toUpperCase()}`)}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
                    <th style={thStyle}>Item de verificação</th>
                    <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} style={{ backgroundColor: index % 2 === 1 ? altRow : 'white' }}>
                      <td style={tdNum}>{index + 1}</td>
                      <td style={tdStyle}>{item.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: statusColor[item.status ?? ''] ?? '#999' }}>
                        {statusLabel[item.status ?? ''] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ─────────────────────────────────────
            REGISTRO FOTOGRÁFICO
        ───────────────────────────────────── */}
        {orderPhotos && orderPhotos.length > 0 && (() => { const n = nextSec(); return (
          <>
            {sectionTitle(n, 'REGISTRO FOTOGRÁFICO')}
            <div className="pd-photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '4px' }}>
              {orderPhotos.map((photo) => (
                <div key={photo.id}>
                  <img src={getStoredImageUrl(photo.photoUrl)} alt={photo.caption || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', border: `1px solid ${border}`, display: 'block' }} />
                  {photo.caption && <p style={{ margin: '3px 0 0', fontSize: '7.5pt', color: mutedColor, textAlign: 'center' }}>{photo.caption}</p>}
                </div>
              ))}
            </div>
          </>
        ); })()}

        {/* ── ASSINATURAS ── */}
        <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <div style={{ borderBottom: `1px solid #111827`, height: '40px', marginBottom: '5px' }} />
            <div style={{ fontSize: '8pt', color: mutedColor }}>Assinatura e carimbo do técnico responsável</div>
          </div>
          <div>
            <div style={{ borderBottom: `1px solid #111827`, height: '40px', marginBottom: '5px' }} />
            <div style={{ fontSize: '8pt', color: mutedColor }}>Assinatura do cliente / responsável</div>
          </div>
        </div>

        {/* ── RODAPÉ ── */}
        <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* logo + empresa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {company?.logoUrl
              ? <img src={getStoredImageUrl(company.logoUrl)} alt="Logo" style={{ height: '32px', maxWidth: '56px', objectFit: 'contain' }} />
              : <div style={{ width: '32px', height: '32px', backgroundColor: '#f2f2f2', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#aaa' }}>LOGO</div>
            }
            <div style={{ fontSize: '7.5pt', color: mutedColor }}>
              <div style={{ fontWeight: 700, color: labelColor }}>{company?.name || 'Empresa'}</div>
              {company?.cnpj && <div>CNPJ: {company.cnpj}</div>}
              {company?.address && <div>{company.address}</div>}
            </div>
          </div>
          {/* número da ordem */}
          <div style={{ textAlign: 'right', fontSize: '7.5pt', color: mutedColor }}>
            <div style={{ fontWeight: 700, color: labelColor }}>Ordem de Serviço</div>
            <div>Nº {numPadded}</div>
            <div>Emitido em {formatDateLong(order!.createdAt)}</div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <AppShell>
      <div className="order-print-page">
      <PrintDocument />
      {(company?.name || company?.address || company?.cnpj || company?.logoUrl) && (
        <Card className="mb-5 overflow-hidden print-company-header" data-testid="card-company-header">
          <CardContent className="p-4 flex items-center gap-4">
            {company.logoUrl ? (
              <img src={getStoredImageUrl(company.logoUrl)} alt={`Logo ${company.name}`} className="h-16 w-20 rounded-md border bg-white object-contain p-1 shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{company.name || 'Empresa'}</p>
              {company.cnpj && <p className="text-xs text-muted-foreground">CNPJ {company.cnpj}</p>}
              {company.address && <p className="text-sm text-muted-foreground mt-1">{company.address}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mb-5 animate-fade-up">
        <Link
          href="/ordens"
          className="print-hide inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ordens de serviço
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                #{order!.number}
              </span>
              <h1 className="font-display text-2xl font-semibold tracking-tight" data-testid="text-order-title">
                {order!.title}
              </h1>
              <StatusBadge status={order!.status} />
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{order!.clientName}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDateTimeBR(order!.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handlePrint} disabled={isPrinting} data-testid="button-export-pdf">
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isPrinting ? 'Preparando…' : 'Exportar PDF'}
            </Button>
            <Select
              value={order!.status}
              onValueChange={(value) => updateOrder(order!.id, { status: value as any })}
              disabled={isStatusUpdating}
            >
              <SelectTrigger className="w-44" data-testid="select-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} data-testid={`option-status-${opt.value}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConfirmDeleteDialog
              trigger={
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" data-testid="button-delete-order">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Excluir ordem de serviço"
              description="Tem certeza que deseja excluir esta ordem? Todos os itens vinculados também serão removidos."
              onConfirm={() => deleteOrder(order!.id, () => setLocation('/ordens'))}
              isPending={isDeletingOrder}
            />
          </div>
        </div>
      </div>

      {/* Description + total */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descrição</h2>
            <p className="text-sm leading-relaxed" data-testid="text-order-description">
              {order!.description || 'Nenhuma descrição informada para esta ordem.'}
            </p>
            <div className="mt-5 pt-4 border-t">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço do atendimento</h2>
                {!isEditingAddress && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setIsEditingAddress(true)}
                    data-testid="button-edit-order-address"
                  >
                    Editar
                  </Button>
                )}
              </div>
              {isEditingAddress ? (
                <div className="space-y-2">
                  <Input
                    value={addressDraft}
                    onChange={(event) => setAddressDraft(event.target.value)}
                    placeholder="Ex: Rua das Flores, 123 — Bairro"
                    data-testid="input-edit-order-address"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddressDraft(order!.address ?? '');
                        setIsEditingAddress(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isStatusUpdating}
                      onClick={() =>
                        updateOrder(order!.id, { address: addressDraft }, () => setIsEditingAddress(false))
                      }
                      data-testid="button-save-order-address"
                    >
                      {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar endereço
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed flex items-start gap-2" data-testid="text-order-address">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{order!.address || 'Nenhum endereço informado para esta ordem.'}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-display text-xl font-bold tracking-tight" data-testid="text-order-total">
                {formatCurrencyBRL(order!.totalPrice)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist / laudo */}
      <Card className="mb-6 animate-fade-up order-checklist-section" style={{ animationDelay: '120ms' }}>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Checklist
                <Badge variant="secondary" className="font-mono text-[10px]">{checklistItems?.length ?? 0}</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Adicione um ou mais checklists e registre a situação de cada item.</p>
            </div>
            <div className="print-hide flex items-center gap-2 w-full md:w-auto">
              {(() => {
                const appliedIds = new Set((checklistItems ?? []).map((i) => i.checklistId).filter(Boolean));
                const available = (checklists ?? []).filter((c) => !appliedIds.has(c.id));
                return (
                  <>
                    <select
                      value={selectedChecklistId}
                      onChange={(event) => setSelectedChecklistId(event.target.value)}
                      className="flex h-9 min-w-0 md:w-72 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      data-testid="select-checklist-template"
                    >
                      <option value="">Selecione o checklist a adicionar</option>
                      {available.map((checklist) => (
                        <option key={checklist.id} value={checklist.id}>
                          {checklist.name} ({checklist.items.length} itens)
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedChecklistId || isChecklistPending}
                      onClick={() => applyChecklist(order!.id, Number(selectedChecklistId), () => setSelectedChecklistId(''))}
                      data-testid="button-add-checklist-item"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Aplicar checklist
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>

          {!checklistItems?.length ? (
            <div className="py-8 text-center border border-dashed rounded-lg">
              <ClipboardCheck className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum checklist aplicado a esta ordem.</p>
              {!checklists?.length && <Link href="/checklist" className="text-sm text-primary hover:underline mt-2 inline-block">Cadastrar um checklist</Link>}
            </div>
          ) : (() => {
            // Build templateId → checklistId lookup for pre-migration items (checklistId may be null)
            const templateToChecklistId = new Map<number, number>();
            for (const cl of checklists ?? []) {
              for (const tmpl of cl.items) templateToChecklistId.set(tmpl.id, cl.id);
            }
            const checklistMap = new Map((checklists ?? []).map((c) => [c.id, c.name]));
            const groups = new Map<number, typeof checklistItems>();
            for (const item of checklistItems) {
              const key = item.checklistId
                ?? (item.templateId != null ? (templateToChecklistId.get(item.templateId) ?? 0) : 0);
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key)!.push(item);
            }
            return (
              <div className="space-y-5">
                {Array.from(groups.entries()).map(([gid, items]) => (
                  <div key={gid} className="rounded-lg border overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                      <span className="text-sm font-semibold">
                        {gid ? (checklistMap.get(gid) ?? 'Checklist') : 'Itens avulsos'}
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground font-normal">({items.length})</span>
                      </span>
                      {gid !== 0 && (
                        <ConfirmDeleteDialog
                          trigger={
                            <Button variant="ghost" size="sm" className="print-hide h-7 text-destructive hover:text-destructive px-2 text-xs">
                              <Trash2 className="h-3 w-3 mr-1" /> Remover checklist
                            </Button>
                          }
                          title="Remover checklist da ordem"
                          description={`Remover todos os itens de "${checklistMap.get(gid) ?? 'checklist'}" desta ordem?`}
                          onConfirm={() => removeChecklist(order!.id, gid)}
                          isPending={isChecklistPending}
                        />
                      )}
                    </div>
                    {/* Compact table */}
                    <table className="w-full text-sm">
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20" data-testid={`checklist-item-${item.id}`}>
                            <td className="w-8 px-3 py-2 text-xs font-mono text-muted-foreground text-right select-none">{index + 1}</td>
                            <td className="px-2 py-2 font-medium">{item.name}</td>
                            <td className="px-2 py-2">
                              {/* print view */}
                              <span className="print-only checklist-print-status">{CHECKLIST_STATUS_LABELS[item.status ?? ''] ?? '—'}</span>
                              {/* interactive buttons */}
                              <div className="print-hide flex gap-1">
                                {(['conforme', 'nao_conforme', 'nao_se_aplica'] as const).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={isChecklistPending}
                                    data-testid={`select-checklist-status-${item.id}-${s}`}
                                    onClick={() => updateChecklistItem(order!.id, item.id, { status: item.status === s ? undefined : s })}
                                    className={[
                                      'rounded px-2 py-0.5 text-xs font-medium border transition-colors',
                                      item.status === s
                                        ? s === 'conforme'
                                          ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-600 dark:text-green-300'
                                          : s === 'nao_conforme'
                                          ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-600 dark:text-red-300'
                                          : 'bg-muted border-border text-muted-foreground'
                                        : 'border-border text-muted-foreground hover:bg-muted/60',
                                    ].join(' ')}
                                  >
                                    {s === 'conforme' ? 'C' : s === 'nao_conforme' ? 'NC' : 'N/A'}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="w-8 px-2 py-2 print-hide">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground/60 hover:text-destructive"
                                onClick={() => deleteChecklistItem(order!.id, item.id)}
                                disabled={isChecklistPending}
                                data-testid={`button-delete-checklist-item-${item.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 order-line-items-section">
        {/* Services */}
        <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Serviços
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">{order!.serviceItems.length}</Badge>
              </h2>
              <Button size="sm" variant="outline" onClick={() => setServiceDialogOpen(true)} data-testid="button-add-service-item">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {order!.serviceItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum serviço adicionado a esta ordem.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order!.serviceItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-service-item-${item.id}`}>
                      <TableCell className="text-sm">{item.serviceName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">{formatCurrencyBRL(item.totalPrice)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteServiceItem(order!.id, item.id)} data-testid={`button-remove-service-item-${item.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm tracking-tight flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                Materiais
                <Badge variant="secondary" className="ml-1 font-mono text-[10px]">{order!.materialItems.length}</Badge>
              </h2>
              <Button size="sm" variant="outline" onClick={() => setMaterialDialogOpen(true)} data-testid="button-add-material-item">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {order!.materialItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Nenhum material adicionado a esta ordem.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order!.materialItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-material-item-${item.id}`}>
                      <TableCell className="text-sm">{item.materialName}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-mono font-medium">{formatCurrencyBRL(item.totalPrice)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => deleteMaterialItem(order!.id, item.id)} data-testid={`button-remove-material-item-${item.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fotos anexadas à ordem */}
      <Card className="mt-4 mb-6 animate-fade-up order-photos-section" style={{ animationDelay: '160ms' }}>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-semibold flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" />
                Fotos do serviço
                <Badge variant="secondary" className="font-mono text-[10px]">{orderPhotos?.length ?? 0}</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Anexe fotos gerais da execução. Elas aparecerão no final do laudo.</p>
            </div>
          </div>

          <div className="print-hide grid md:grid-cols-[1fr_1fr_auto] gap-2 items-end mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Foto</label>
              <Input
                key={photoInputKey}
                className="mt-1"
                onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isPhotoUploading}
                data-testid="input-order-photo-url"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Legenda (opcional)</label>
              <Input
                className="mt-1"
                value={photoCaptionDraft}
                onChange={(event) => setPhotoCaptionDraft(event.target.value)}
                placeholder="Ex: Equipamento após a manutenção"
                data-testid="input-order-photo-caption"
              />
            </div>
            <Button
              variant="outline"
              disabled={!photoFile || isPhotoPending || isPhotoUploading}
              onClick={async () => {
                if (!photoFile) return;
                try {
                  const objectPath = await uploadImage(photoFile);
                  addPhoto(order!.id, { photoUrl: objectPath, caption: photoCaptionDraft.trim() || undefined }, () => {
                    setPhotoFile(null);
                    setPhotoInputKey((current) => current + 1);
                    setPhotoCaptionDraft('');
                  });
                } catch (error) {
                  toast({ title: 'Erro ao anexar foto', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
                }
              }}
              data-testid="button-add-order-photo"
            >
              {isPhotoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Anexar foto
            </Button>
          </div>

          {!orderPhotos?.length ? (
            <div className="py-8 text-center border border-dashed rounded-lg">
              <ImagePlus className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma foto adicionada a esta ordem.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 order-photos-grid">
              {orderPhotos.map((photo) => (
                <div key={photo.id} className="relative rounded-lg border overflow-hidden bg-muted/20 group order-photo-card" data-testid={`order-photo-${photo.id}`}>
                  <a href={getStoredImageUrl(photo.photoUrl)} target="_blank" rel="noreferrer">
                    <img src={getStoredImageUrl(photo.photoUrl)} alt={photo.caption || 'Foto do serviço'} className="w-full aspect-[4/3] object-cover order-photo-image" />
                  </a>
                  <div className="p-2 flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{photo.caption || 'Foto do serviço'}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="print-hide h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => deletePhoto(order!.id, photo.id)}
                      disabled={isPhotoPending}
                      data-testid={`button-delete-order-photo-${photo.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddOrderItemDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        title="Adicionar serviço"
        description="Escolha um serviço do catálogo e informe a quantidade."
        items={services ?? []}
        emptyLabel="Cadastre um serviço no catálogo primeiro"
        isPending={isAddingService}
        onSubmit={(serviceId, quantity, unitPrice) =>
          addServiceItem(order!.id, { serviceId, quantity, unitPrice }, () => setServiceDialogOpen(false))
        }
      />
      <AddOrderItemDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        title="Adicionar material"
        description="Escolha um material do estoque e informe a quantidade."
        items={materials ?? []}
        emptyLabel="Cadastre um material no estoque primeiro"
        isPending={isAddingMaterial}
        onSubmit={(materialId, quantity, unitPrice) =>
          addMaterialItem(order!.id, { materialId, quantity, unitPrice }, () => setMaterialDialogOpen(false))
        }
      />
      </div>
    </AppShell>
  );
}
