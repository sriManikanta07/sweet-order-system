import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Croissant,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BAKERY } from "@/config/bakery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, Calendar, Truck, StickyNote, Package } from "lucide-react";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { InvoiceDialog } from "@/components/admin/InvoiceDialog";

type Order = Tables<"orders">;
type DeliveryType = Order["delivery_type"];
type PaymentStatus = Order["payment_status"];
type OrderStatus = Order["order_status"];

type FormState = {
  customer_name: string;
  phone_number: string;
  product_details: string;
  quantity: string;
  delivery_date: string;
  delivery_type: DeliveryType;
  total_amount: string;
  advance_paid: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes: string;
};

const blankForm: FormState = {
  customer_name: "",
  phone_number: "",
  product_details: "",
  quantity: "1",
  delivery_date: new Date().toISOString().slice(0, 10),
  delivery_type: "pickup",
  total_amount: "",
  advance_paid: "0",
  payment_status: "pending",
  order_status: "pending",
  notes: "",
};

const orderStatusVariants: Record<OrderStatus, string> = {
  pending: "bg-highlight/40 text-highlight-foreground",
  preparing: "bg-secondary text-primary",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const paymentStatusVariants: Record<PaymentStatus, string> = {
  pending: "bg-destructive/10 text-destructive",
  partial: "bg-highlight/40 text-highlight-foreground",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    document.title = `Orders — ${BAKERY.name} Admin`;
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.order_status === "pending").length;
    const completed = orders.filter((o) => o.order_status === "completed").length;
    const revenue = orders
      .filter((o) => o.payment_status !== "pending")
      .reduce((sum, o) => sum + Number(o.advance_paid ?? 0), 0);
    const outstanding = orders.reduce(
      (sum, o) => sum + Math.max(0, Number(o.total_amount ?? 0) - Number(o.advance_paid ?? 0)),
      0,
    );
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = orders.filter((o) => (o.created_at ?? "").slice(0, 10) === todayStr).length;
    return { total, pending, completed, revenue, outstanding, today };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (!q) return true;
      return (
        o.order_code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone_number.toLowerCase().includes(q) ||
        o.product_details.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const openNew = () => {
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (o: Order) => {
    setEditing(o);
    setForm({
      customer_name: o.customer_name,
      phone_number: o.phone_number,
      product_details: o.product_details,
      quantity: String(o.quantity),
      delivery_date: o.delivery_date,
      delivery_type: o.delivery_type,
      total_amount: String(o.total_amount),
      advance_paid: String(o.advance_paid),
      payment_status: o.payment_status,
      order_status: o.order_status,
      notes: o.notes ?? "",
    });
    setDialogOpen(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"orders"> = {
        customer_name: form.customer_name.trim(),
        phone_number: form.phone_number.trim(),
        product_details: form.product_details.trim(),
        quantity: Math.max(1, parseInt(form.quantity, 10) || 1),
        delivery_date: form.delivery_date,
        delivery_type: form.delivery_type,
        total_amount: Number(form.total_amount) || 0,
        advance_paid: Number(form.advance_paid) || 0,
        payment_status: form.payment_status,
        order_status: form.order_status,
        notes: form.notes.trim() || null,
        order_code: editing?.order_code ?? "",
      };
      if (editing) {
        const { error } = await supabase.from("orders").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Order updated" : "Order created");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setSaving(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickStatus = async (o: Order, next: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: next })
      .eq("id", o.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked ${next}`);
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const quickPayment = async (o: Order, next: PaymentStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: next })
      .eq("id", o.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment marked ${next}`);
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone_number || !form.product_details || !form.total_amount) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    upsertMutation.mutate();
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = [
      "order_code",
      "created_at",
      "customer_name",
      "phone_number",
      "product_details",
      "quantity",
      "delivery_date",
      "delivery_type",
      "total_amount",
      "advance_paid",
      "payment_status",
      "order_status",
      "notes",
    ];
    const rows = filtered.map((o) =>
      headers.map((h) => csvEscape((o as unknown as Record<string, unknown>)[h])).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} orders`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-bakery flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-warm text-primary-foreground">
              <Croissant className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold">{BAKERY.name}</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Orders
              </span>
            </div>
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground/80 hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="container-bakery py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              Manage
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, search, update payment & delivery status, and export.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              New order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={ShoppingBag} label="Total orders" value={stats.total} />
          <StatCard icon={Calendar} label="Today" value={stats.today} />
          <StatCard icon={Clock} label="Pending" value={stats.pending} />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} />
          <StatCard
            icon={IndianRupee}
            label="Outstanding"
            value={`${BAKERY.currency}${stats.outstanding.toLocaleString()}`}
          />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, phone, item…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No orders match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => setDetailOrder(o)}
                    >
                      <TableCell className="font-mono text-xs">{o.order_code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{o.customer_name}</div>
                        <a
                          href={`https://wa.me/${o.phone_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {o.phone_number}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="truncate text-sm">{o.product_details}</div>
                        <div className="text-xs text-muted-foreground">Qty: {o.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{o.delivery_type}</div>
                        <div className="text-xs text-muted-foreground">{o.delivery_date}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {BAKERY.currency}
                        {Number(o.total_amount).toLocaleString()}
                        {Number(o.advance_paid) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Paid {BAKERY.currency}
                            {Number(o.advance_paid).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={o.payment_status}
                          onValueChange={(v) => quickPayment(o, v as PaymentStatus)}
                        >
                          <SelectTrigger
                            className={`h-8 w-[120px] border-0 ${paymentStatusVariants[o.payment_status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={o.order_status}
                          onValueChange={(v) => quickStatus(o, v as OrderStatus)}
                        >
                          <SelectTrigger
                            className={`h-8 w-[130px] border-0 ${orderStatusVariants[o.order_status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setInvoiceOrder(o)}
                            title="Print invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(o)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(o)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Order details side panel */}
      <Sheet open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detailOrder && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center justify-between gap-2">
                  <SheetTitle className="font-display text-xl">
                    {detailOrder.customer_name}
                  </SheetTitle>
                  <Badge
                    className={orderStatusVariants[detailOrder.order_status]}
                    variant="secondary"
                  >
                    {detailOrder.order_status}
                  </Badge>
                </div>
                <SheetDescription className="font-mono text-xs">
                  {detailOrder.order_code} · placed{" "}
                  {new Date(detailOrder.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <section>
                  <SectionLabel icon={Phone} text="Contact" />
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                    <span className="text-sm font-medium">{detailOrder.phone_number}</span>
                    <a
                      href={`https://wa.me/${detailOrder.phone_number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </section>

                <section>
                  <SectionLabel icon={Package} text="Product details" />
                  <div className="mt-2 rounded-lg border border-border bg-card p-3">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {detailOrder.product_details}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-primary">
                        Qty {detailOrder.quantity}
                      </span>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionLabel icon={Truck} text="Delivery" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <InfoTile label="Type" value={detailOrder.delivery_type} capitalize />
                    <InfoTile
                      label="Date"
                      value={new Date(detailOrder.delivery_date).toLocaleDateString()}
                      icon={Calendar}
                    />
                  </div>
                </section>

                <section>
                  <SectionLabel icon={IndianRupee} text="Payment" />
                  <div className="mt-2 space-y-2 rounded-lg border border-border bg-card p-3">
                    <Row label="Total">
                      <span className="font-display text-lg font-semibold">
                        {BAKERY.currency}
                        {Number(detailOrder.total_amount).toLocaleString()}
                      </span>
                    </Row>
                    <Row label="Advance paid">
                      <span>
                        {BAKERY.currency}
                        {Number(detailOrder.advance_paid).toLocaleString()}
                      </span>
                    </Row>
                    <Separator />
                    <Row label="Balance due">
                      <span className="font-medium">
                        {BAKERY.currency}
                        {Math.max(
                          0,
                          Number(detailOrder.total_amount) - Number(detailOrder.advance_paid),
                        ).toLocaleString()}
                      </span>
                    </Row>
                    <Row label="Status">
                      <Badge
                        className={paymentStatusVariants[detailOrder.payment_status]}
                        variant="secondary"
                      >
                        {detailOrder.payment_status}
                      </Badge>
                    </Row>
                  </div>
                </section>

                {detailOrder.notes && (
                  <section>
                    <SectionLabel icon={StickyNote} text="Notes" />
                    <p className="mt-2 whitespace-pre-wrap rounded-lg border border-dashed border-border bg-highlight/20 p-3 text-sm text-foreground">
                      {detailOrder.notes}
                    </p>
                  </section>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setInvoiceOrder(detailOrder);
                    }}
                  >
                    <Printer className="mr-1.5 h-4 w-4" />
                    Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const o = detailOrder;
                      setDetailOrder(null);
                      openEdit(o);
                    }}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteTarget(detailOrder);
                      setDetailOrder(null);
                    }}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit order" : "New order"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Update details for ${editing.order_code}.`
                : "Manually log a phone or walk-in order."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Label htmlFor="customer_name">Customer name *</Label>
              <Input
                id="customer_name"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="phone_number">Phone *</Label>
              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+91…"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="product_details">Item / details *</Label>
              <Textarea
                id="product_details"
                value={form.product_details}
                onChange={(e) => setForm({ ...form, product_details: e.target.value })}
                placeholder="e.g. 1× Sourdough loaf, 2× Almond croissant"
                rows={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="delivery_date">Delivery date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Delivery type</Label>
              <Select
                value={form.delivery_type}
                onValueChange={(v) => setForm({ ...form, delivery_type: v as DeliveryType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="total_amount">Total ({BAKERY.currency}) *</Label>
              <Input
                id="total_amount"
                type="number"
                min={0}
                step="0.01"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="advance_paid">Advance paid</Label>
              <Input
                id="advance_paid"
                type="number"
                min={0}
                step="0.01"
                value={form.advance_paid}
                onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
              />
            </div>
            <div>
              <Label>Payment status</Label>
              <Select
                value={form.payment_status}
                onValueChange={(v) => setForm({ ...form, payment_status: v as PaymentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order status</Label>
              <Select
                value={form.order_status}
                onValueChange={(v) => setForm({ ...form, order_status: v as OrderStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Toppings, allergies, address…"
                rows={2}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.order_code} for {deleteTarget?.customer_name}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice preview + print */}
      <InvoiceDialog
        order={invoiceOrder}
        open={!!invoiceOrder}
        onOpenChange={(o) => !o && setInvoiceOrder(null)}
      />
    </div>
  );
};

function SectionLabel({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </div>
  );
}

function InfoTile({
  label,
  value,
  capitalize,
  icon: Icon,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${capitalize ? "capitalize" : ""}`}>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default AdminOrders;
