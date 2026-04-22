import { Link } from "react-router-dom";
import { Croissant, ShoppingBag } from "lucide-react";
import { BAKERY } from "@/config/bakery";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass-cream">
      <div className="container-bakery flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-warm text-primary-foreground shadow-soft transition-transform duration-300 group-hover:rotate-[-8deg]">
            <Croissant className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-foreground">
              {BAKERY.name}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Artisan Bakery
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <a
            href="#menu"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:inline-block"
          >
            Menu
          </a>
          <a
            href="#about"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:inline-block"
          >
            Our story
          </a>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground/80 shadow-soft transition-all hover:border-primary/40 hover:text-primary sm:text-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
