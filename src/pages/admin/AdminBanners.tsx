import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Croissant,
  ImageOff,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { BAKERY } from "@/config/bakery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BannerCarousel, type Banner } from "@/components/storefront/BannerCarousel";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type BannerRow = Tables<"banners">;

type FormState = {
  title: string;
  link_url: string;
  image_url: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  link_url: "",
  image_url: "",
  is_active: true,
};

const AdminBanners = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = `Banners — ${BAKERY.name} Admin`;
  }, []);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BannerRow[];
    },
  });

  const activeBanners: Banner[] = (banners ?? [])
    .filter((b) => b.is_active)
    .map((b) => ({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url,
    }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
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
      const url = await uploadToCloudinary(file, "bakery/banners");
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
      if (!form.image_url) throw new Error("Please upload a banner image");
      const nextOrder =
        (banners?.reduce((max, b) => Math.max(max, b.display_order), -1) ?? -1) + 1;
      const payload: TablesInsert<"banners"> = {
        title: form.title.trim() || null,
        link_url: form.link_url.trim() || null,
        image_url: form.image_url,
        is_active: form.is_active,
        display_order: nextOrder,
      };
      const { error } = await supabase.from("banners").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner added");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
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

  const toggleActive = async (b: BannerRow, next: boolean) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: next })
      .eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("banners").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner deleted");
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
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
                Banners
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

      <main className="pb-12">
        <div className="container-bakery pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                Homepage
              </span>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Banners
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload, preview, and remove the carousel images on your homepage.
              </p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add banner
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <section>
          <div className="container-bakery">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Live preview
            </div>
          </div>
          {activeBanners.length > 0 ? (
            <BannerCarousel banners={activeBanners} />
          ) : (
            <div className="container-bakery">
              <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <ImageOff className="h-6 w-6 text-muted-foreground" />
                <p className="font-display text-lg font-semibold">No active banners</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Upload a banner to see it appear on the homepage carousel.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Banner list */}
        <section className="container-bakery mt-10">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            All banners
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {isLoading ? (
              <div className="grid place-items-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !banners || banners.length === 0 ? (
              <div className="grid place-items-center gap-3 py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
                  <ImageOff className="h-5 w-5" />
                </div>
                <p className="font-display text-lg font-semibold">No banners yet</p>
                <Button onClick={openCreate} className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Add your first banner
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {banners.map((b) => (
                  <li key={b.id} className="flex items-center gap-4 p-4">
                    <img
                      src={b.image_url}
                      alt={b.title ?? "Banner"}
                      className="h-16 w-28 shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {b.title ?? <span className="text-muted-foreground">Untitled banner</span>}
                      </p>
                      {b.link_url && (
                        <p className="truncate text-xs text-muted-foreground">{b.link_url}</p>
                      )}
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <span className="text-xs text-muted-foreground">
                        {b.is_active ? "Live" : "Hidden"}
                      </span>
                      <Switch
                        checked={b.is_active}
                        onCheckedChange={(v) => toggleActive(b, v)}
                        aria-label="Toggle visibility"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(b)}
                      aria-label="Delete banner"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New banner</DialogTitle>
            <DialogDescription>
              Upload a wide image (recommended 1600×900). It will appear in the homepage carousel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image *</Label>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-secondary">
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
                    htmlFor="banner-image-input"
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
                    id="banner-image-input"
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

            <div className="space-y-2">
              <Label htmlFor="b-title">Title (optional)</Label>
              <Input
                id="b-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Fresh sourdough every Saturday"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="b-link">Link URL (optional)</Label>
              <Input
                id="b-link"
                type="url"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://…"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 p-3">
              <div>
                <Label htmlFor="b-active" className="text-sm font-medium">
                  Show on homepage
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hidden banners won't appear in the carousel.
                </p>
              </div>
              <Switch
                id="b-active"
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
              Add banner
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
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it from your homepage carousel. The image stays on Cloudinary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBanners;
