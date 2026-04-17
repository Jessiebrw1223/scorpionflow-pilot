import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Loader2,
  Hotel,
  Sparkles,
  Briefcase,
  CircleDot,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClientType = "hotel" | "spa" | "business" | "other";

interface Client {
  id: string;
  name: string;
  company: string | null;
  client_type: ClientType;
  email: string | null;
  phone: string | null;
  ruc: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const TYPE_META: Record<ClientType, { label: string; icon: typeof Hotel; color: string }> = {
  hotel: { label: "Hotel", icon: Hotel, color: "text-status-progress" },
  spa: { label: "Spa", icon: Sparkles, color: "text-accent" },
  business: { label: "Negocio", icon: Briefcase, color: "text-primary" },
  other: { label: "Otro", icon: CircleDot, color: "text-muted-foreground" },
};

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  client_type: z.enum(["hotel", "spa", "business", "other"]),
  email: z.string().trim().email("Correo inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  ruc: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  name: "",
  company: "",
  client_type: "business",
  email: "",
  phone: "",
  ruc: "",
  notes: "",
};

export default function ClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientType | "all">("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchType = typeFilter === "all" || c.client_type === typeFilter;
      if (!matchType) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.ruc || "").toLowerCase().includes(q)
      );
    });
  }, [clients, search, typeFilter]);

  const upsert = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const payload = {
        owner_id: userData.user.id,
        name: values.name,
        company: values.company || null,
        client_type: values.client_type,
        email: values.email || null,
        phone: values.phone || null,
        ruc: values.ruc || null,
        notes: values.notes || null,
      };

      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editing ? "Cliente actualizado" : "Cliente creado", {
        description: form.name,
      });
      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente eliminado");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fld = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fld.name?.[0],
        company: fld.company?.[0],
        email: fld.email?.[0],
        phone: fld.phone?.[0],
        ruc: fld.ruc?.[0],
        notes: fld.notes?.[0],
      });
      return;
    }
    setErrors({});
    upsert.mutate(parsed.data);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name,
      company: c.company || "",
      client_type: c.client_type,
      email: c.email || "",
      phone: c.phone || "",
      ruc: c.ruc || "",
      notes: c.notes || "",
    });
    setOpenForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
            <Users className="w-5 h-5 text-primary fire-icon" />
            Clientes
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Gestiona tu cartera de relaciones comerciales
          </p>
        </div>

        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="fire-button font-semibold">
              <Plus className="w-4 h-4" />
              Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="fire-text">
                {editing ? "Editar cliente" : "Nuevo cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ana García"
                  />
                  {errors.name && <p className="text-[12px] text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme S.A.C."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select
                    value={form.client_type}
                    onValueChange={(v: ClientType) => setForm({ ...form, client_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_META) as ClientType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_META[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Correo</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="text-[12px] text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>RUC / Documento</Label>
                  <Input value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Notas</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={upsert.isPending} className="fire-button">
                  {upsert.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Guardar cambios" : "Crear cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, empresa, email o RUC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          {(["all", "hotel", "spa", "business", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 text-[12px] rounded-md transition-sf font-medium",
                typeFilter === t
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(15_90%_55%/0.5)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "Todos" : TYPE_META[t].label}
            </button>
          ))}
        </div>
        <Badge variant="outline" className="ml-auto font-mono-data">
          {filtered.length} de {clients.length}
        </Badge>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Cargando clientes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center fire-glow">
              <Users className="w-7 h-7 text-primary fire-icon" />
            </div>
            <p className="text-foreground font-medium">
              {clients.length === 0 ? "Aún no tienes clientes" : "Sin resultados"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {clients.length === 0
                ? "Empieza agregando tu primer cliente al sistema"
                : "Prueba con otros filtros o términos de búsqueda"}
            </p>
            {clients.length === 0 && (
              <Button onClick={openCreate} className="fire-button mt-2">
                <Plus className="w-4 h-4" />
                Agregar primer cliente
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-3">
                  Tipo
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-3">
                  Contacto
                </th>
                <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-3">
                  RUC
                </th>
                <th className="text-right text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const TypeIcon = TYPE_META[c.client_type].icon;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-sf group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg scorpion-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 group-hover:fire-glow transition-all">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{c.name}</div>
                          {c.company && (
                            <div className="text-[12px] text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {c.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-[12px] font-medium",
                          TYPE_META[c.client_type].color
                        )}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {TYPE_META[c.client_type].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[12px]">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono-data text-muted-foreground">
                      {c.ruc || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                          className="h-8 w-8 hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(c)}
                          className="h-8 w-8 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{deleting?.name}" del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
