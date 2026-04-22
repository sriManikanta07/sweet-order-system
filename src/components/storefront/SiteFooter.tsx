import { Croissant, Instagram, MessageCircle } from "lucide-react";
import { BAKERY, buildWhatsAppOrderUrl } from "@/config/bakery";

export function SiteFooter() {
  const generalUrl = `https://wa.me/${BAKERY.whatsappNumber}`;
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container-bakery py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-warm text-primary-foreground">
                <Croissant className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-semibold">{BAKERY.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {BAKERY.tagline}. Order any item directly on WhatsApp — we confirm within the hour.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hours
            </h4>
            <p className="mt-3 text-sm text-foreground">{BAKERY.locationLine}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Custom cakes — please order 48h ahead
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Place an order
            </h4>
            <a
              href={generalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:bg-primary-glow hover:shadow-warm"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <div className="mt-4 flex items-center gap-3 text-muted-foreground">
              <a
                href="#"
                aria-label="Instagram"
                className="transition-colors hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} {BAKERY.name}. Baked fresh daily.</span>
          <span>Made with butter, flour, and a lot of patience.</span>
        </div>
      </div>
    </footer>
  );
}
