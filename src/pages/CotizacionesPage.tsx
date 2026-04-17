import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  Loader2,
  Trash2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Send,
  PhoneCall,
  Clock,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type QuoteStatus = "pending" | "in_contact" | "quoted" | "won" | "lost";

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}
interface Quotation {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  tax_rate: number;
  total: number;
  converted_to_project: boolean;
  created_at: string;
  client?: { id: string; name: string; company: string | null };
}

const STATUS_META: Record<
  QuoteStatus,
  { label: string; icon: typeof Clock; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "text-status-todo",
    bg: "bg-status-todo/10",
    border: "border-status-todo/30",
  },
  in_contact: {
    label: "En contacto",
    icon: PhoneCall,
    color: "text-status-progress",
    bg: "bg-status-progress/10",
    border: "border-status-progress/30",
  },
  quoted: {
    label: "Cotizado",
    icon: Send,
    color: "text-status-review",
    bg: "bg-status-review/10",
    border: "border-status-review/30",
  },
  won: {
    label: "Ganado",
    icon: CheckCircle2,
    color: "text-cost-positive",
    bg: "bg-cost-positive/10",
    border: "border-cost-positive/40",
  },
  lost: {
    label: "Perdido",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
};

const STAGE_ORDER: QuoteStatus[] = ["pending", "in_contact", "quoted", "won", "lost"];

const itemSchema = z.object({
  description: z.string().trim().min(1, "Requerido").max(200),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});
const formSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente"),
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  currency: z.string().min(3).max(3),
  tax_rate: z.number().min(0).max(100),
  items: z.array(itemSchema).min(1, "Agrega al menos un ítem"),
});

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export default function CotizacionesPage() {
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*, client:clients(id, name, company)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
  });

  const [form, setForm] = useState({
    client_id: "",
    title: "",
    description: "",
    currency: "PEN",
    tax_rate: 18,
    items: [{ description: "", quantity: 1, unit_price: 0 }] as QuoteItem[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = useMemo(
    () => form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0),
    [form.items]
  );
  const tax = subtotal * (form.tax_rate / 100);
  const total = subtotal + tax;

  const create = useMutation({
    mutationFn: async () => {
      const parsed = formSchema.safeParse({
        ...form,
        items: form.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      });
      if (!parsed.success) {
        const fld = parsed.error.flatten().fieldErrors;
        const fe: Record<string, string> = {};
        Object.entries(fld).forEach(([k, v]) => {
          if (v && v[0]) fe[k] = v[0];
        });
        setErrors(fe);
        throw new Error("Datos inválidos");
      }
      setErrors({});

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { data: q, error } = await supabase
        .from("quotations")
        .insert({
          owner_id: userData.user.id,
          client_id: parsed.data.client_id,
          title: parsed.data.title,
          description: parsed.data.description || null,
          currency: parsed.data.currency,
          tax_rate: parsed.data.tax_rate,
          subtotal,
          total,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const items = parsed.data.items.map((i, idx) => ({
        quotation_id: q.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.quantity * i.unit_price,
        position: idx,
      }));
      const { error: itemsErr } = await supabase.from("quotation_items").insert(items);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Cotización creada", { description: "Lista para gestionar en el pipeline." });
      setOpenForm(false);
      setForm({
        client_id: "",
        title: "",
        description: "",
        currency: "PEN",
        tax_rate: 18,
        items: [{ description: "", quantity: 1, unit_price: 0 }],
      });
    },
    onError: (e: Error) => {
      if (e.message !== "Datos inválidos") toast.error("Error", { description: e.message });
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success(`Movido a "${STATUS_META[v.status].label}"`);
    },
  });

  const convertToProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quotations")
        .update({ converted_to_project: true, status: "won" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Convertida en proyecto", {
        description: "Ya puedes gestionarla desde el módulo Proyectos.",
      });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Cotización eliminada");
    },
  });

  const grouped = useMemo(() => {
    const m: Record<QuoteStatus, Quotation[]> = {
      pending: [],
      in_contact: [],
      quoted: [],
      won: [],
      lost: [],
    };
    quotes.forEach((q) => m[q.status].push(q));
    return m;
  }, [quotes]);

  const totalWon = quotes.filter((q) => q.status === "won").reduce((s, q) => s + Number(q.total), 0);
  const conversionRate =
    quotes.length > 0 ? (quotes.filter((q) => q.status === "won").length / quotes.length) * 100 : 0;

  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
            <DollarSign className="w-5 h-5 text-primary fire-icon" />
            Cotizaciones
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Pipeline comercial: {quotes.length} cotizaciones · Conversión {conversionRate.toFixed(0)}%
            · Ganado {PEN.format(totalWon)}
          </p>
        </div>

        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button
              className="fire-button font-semibold"
              disabled={clients.length === 0}
              title={clients.length === 0 ? "Crea un cliente primero" : ""}
            >
              <Plus className="w-4 h-4" />
              Nueva cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="fire-text">Nueva cotización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={(v) => setForm({ ...form, client_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `· ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && (
                    <p className="text-[12px] text-destructive">{errors.client_id}</p>
                  )}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Título *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Implementación de sistema"
                  />
                  {errors.title && <p className="text-[12px] text-destructive">{errors.title}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm({ ...form, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN (Soles)</SelectItem>
                      <SelectItem value="USD">USD (Dólares)</SelectItem>
                      <SelectItem value="EUR">EUR (Euros)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>IGV / Impuesto (%)</Label>
                  <Input
                    type="number"
                    value={form.tax_rate}
                    onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos / Servicios *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        ...form,
                        items: [...form.items, { description: "", quantity: 1, unit_price: 0 }],
                      })
                    }
                  >
                    <Plus className="w-3 h-3" /> Ítem
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start p-2 bg-secondary/30 rounded-md"
                    >
                      <div className="col-span-6">
                        <Input
                          placeholder="Descripción"
                          value={it.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Cant."
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Precio unit."
                          value={it.unit_price}
                          onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {form.items.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                            }
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.items && <p className="text-[12px] text-destructive">{errors.items}</p>}
              </div>

              <div className="surface-card p-3 space-y-1 fire-glow">
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono-data">{PEN.format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>IGV ({form.tax_rate}%)</span>
                  <span className="font-mono-data">{PEN.format(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="font-mono-data fire-text">{PEN.format(total)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                className="fire-button"
              >
                {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear cotización
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 && (
        <div className="surface-card fire-border p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary fire-icon shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Sugerencia inteligente</p>
            <p className="text-[13px] text-muted-foreground">
              Crea tu primer cliente desde el módulo de Clientes para empezar a generar cotizaciones.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Cargando pipeline…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {STAGE_ORDER.map((stage) => {
            const meta = STATUS_META[stage];
            const items = grouped[stage];
            const stageTotal = items.reduce((s, q) => s + Number(q.total), 0);
            const StageIcon = meta.icon;
            return (
              <div
                key={stage}
                className={cn(
                  "surface-card p-3 space-y-2 min-h-[300px] border-t-2",
                  meta.border
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("flex items-center gap-2 font-semibold text-[13px]", meta.color)}>
                    <StageIcon className="w-4 h-4" />
                    {meta.label}
                  </div>
                  <span className="text-[11px] font-mono-data text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {items.length}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono-data uppercase tracking-wider">
                  {PEN.format(stageTotal)}
                </div>

                <div className="space-y-2 pt-1">
                  {items.length === 0 ? (
                    <div className="text-center text-[11px] text-muted-foreground py-6 border border-dashed border-border rounded-md">
                      Sin cotizaciones
                    </div>
                  ) : (
                    items.map((q) => (
                      <div
                        key={q.id}
                        className="surface-card surface-card-hover fire-glow-hover p-2.5 space-y-2 cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-[13px] text-foreground line-clamp-1">
                            {q.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {q.client?.name}
                            {q.client?.company ? ` · ${q.client.company}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold font-mono-data fire-text">
                            {PEN.format(Number(q.total))}
                          </span>
                          {q.converted_to_project && (
                            <span className="text-[10px] uppercase tracking-wider text-cost-positive font-semibold">
                              ★ Proyecto
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 pt-1 border-t border-border">
                          {stage !== "won" && stage !== "lost" && (
                            <Select
                              value={q.status}
                              onValueChange={(v: QuoteStatus) => move.mutate({ id: q.id, status: v })}
                            >
                              <SelectTrigger className="h-7 text-[11px] flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STAGE_ORDER.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {STATUS_META[s].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {stage === "quoted" && !q.converted_to_project && (
                            <Button
                              size="sm"
                              onClick={() => convertToProject.mutate(q.id)}
                              className="h-7 px-2 fire-button text-[11px]"
                              title="Convertir a proyecto"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove.mutate(q.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
