import { MessageCircle } from "lucide-react";
import { BAKERY, buildWhatsAppOrderUrl } from "@/config/bakery";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const orderUrl = buildWhatsAppOrderUrl({
    productName: product.name,
    quantity: 1,
    price: product.price,
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-warm">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <span className="font-display text-lg">No image</span>
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80 backdrop-blur">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              From
            </span>
            <span className="font-display text-2xl font-semibold text-primary">
              {BAKERY.currency}
              {Number(product.price).toLocaleString()}
            </span>
          </div>
        </div>

        <a
          href={orderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-glow hover:shadow-warm"
        >
          <MessageCircle className="h-4 w-4" />
          Order on WhatsApp
        </a>
      </div>
    </article>
  );
}
