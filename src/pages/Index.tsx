import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { BannerCarousel, type Banner } from "@/components/storefront/BannerCarousel";
import { ProductCard, type Product } from "@/components/storefront/ProductCard";
import { ValueStrip } from "@/components/storefront/ValueStrip";
import { OrderDialog } from "@/components/storefront/OrderDialog";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { BAKERY } from "@/config/bakery";

const Index = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    document.title = `${BAKERY.name} — Artisan bakery, order on WhatsApp`;
    const meta =
      document.querySelector('meta[name="description"]') ??
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      `${BAKERY.name} — fresh cakes, pastries and sourdough breads. Order any item directly on WhatsApp.`
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [bannersRes, productsRes] = await Promise.all([
        supabase
          .from("banners")
          .select("id,title,image_url,link_url")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("products")
          .select("id,name,description,price,image_url,category")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      if (bannersRes.data) setBanners(bannersRes.data as Banner[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const visible = useMemo(
    () => (activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory)),
    [products, activeCategory]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {loading ? (
          <div className="container-bakery pt-6">
            <Skeleton className="h-[42vh] min-h-[280px] w-full rounded-2xl sm:h-[55vh] sm:min-h-[420px]" />
          </div>
        ) : (
          <BannerCarousel banners={banners} />
        )}

        <ValueStrip />

        <section id="menu" className="container-bakery pb-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                Today's bake
              </span>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-tight text-foreground text-balance sm:text-5xl">
                Fresh from our oven
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
                Tap any item to order on WhatsApp — we'll confirm availability and delivery in minutes.
              </p>
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c)}
                    className={
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all " +
                      (activeCategory === c
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-primary")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : visible.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <ProductCard
                      product={p}
                      onOrder={(prod) => {
                        setOrderProduct(prod);
                        setOrderOpen(true);
                      }}
                    />
                  </div>
                ))}
          </div>

          {!loading && visible.length === 0 && (
            <div className="mt-12 rounded-xl border border-dashed border-border bg-secondary/40 p-12 text-center">
              <p className="font-display text-xl text-foreground">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New bakes are being added — check back soon.
              </p>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      <OrderDialog
        product={orderProduct}
        open={orderOpen}
        onOpenChange={setOrderOpen}
      />

      <CartDrawer />
    </div>
  );
};

export default Index;
