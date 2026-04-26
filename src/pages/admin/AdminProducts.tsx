import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Croissant,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  ImageOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { BAKERY } from "@/config/bakery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Product = Tables<"products">;

type FormState = {
  name: string;
  price: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  category: "",
  description: "",
  image_url: "",
  is_active: true,
};

const AdminProducts = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = `Products — ${BAKERY.name} Admin`;
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category ?? "",
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be smaller than 8 MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const priceNum = Number(form.price);
      if (!name) throw new Error("Name is required");
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Enter a valid price");
      }

      const payload: TablesInsert<"products"> = {
        name,
        price: priceNum,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
      };

      if (editing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product added");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Save failed");
    },
    onSettled: () => setSaving(false),
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
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
                Products
              </span>
            </div>
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground/80 transition-all hover:border-primary/40 hover:text-primary"
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
              Catalog
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Products
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, and manage what appears on your storefront.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !products || products.length === 0 ? (
            <div className="grid place-items-center gap-3 py-20 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
                <ImageOff className="h-5 w-5" />
              </div>
              <p className="font-display text-lg font-semibold">No products yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add your first item so customers can order it on WhatsApp.
              </p>
              <Button onClick={openCreate} className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                Add product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-12 w-12 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-md bg-secondary text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {p.category ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {BAKERY.currency}
                      {Number(p.price).toFixed(0)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={
                          p.is_active
                            ? "rounded-full bg-highlight/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-highlight-foreground"
                            : "rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                        }
                      >
                        {p.is_active ? "Live" : "Hidden"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.name}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit product" : "New product"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Update the details below." : "Fill in the details to add it to your menu."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-secondary">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="product-image-input"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    {uploading ? "Uploading…" : form.image_url ? "Replace image" : "Upload image"}
                  </label>
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    JPG/PNG/WebP up to 8 MB. Stored on Cloudinary.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-name">Name *</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Sourdough loaf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Price ({BAKERY.currency}) *</Label>
                <Input
                  id="p-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-category">Category</Label>
                <Input
                  id="p-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Breads"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Slow-fermented, crackling crust, open crumb…"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 p-3">
              <div>
                <Label htmlFor="p-active" className="text-sm font-medium">
                  Visible on storefront
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hidden products won't appear to customers.
                </p>
              </div>
              <Switch
                id="p-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !deleting && !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed from your catalog. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
