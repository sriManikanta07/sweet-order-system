import { useEffect, useState } from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BAKERY, buildWhatsAppOrderText, buildWhatsAppOrderUrl } from "@/config/bakery";
import type { Product } from "./ProductCard";

interface OrderDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDialog({ product, open, onOpenChange }: OrderDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNote("");
    }
  }, [open, product?.id]);

  if (!product) return null;

  const subtotal = Number(product.price) * quantity;
  const messageOpts = {
    productName: product.name,
    quantity,
    price: product.price,
    note,
    imageUrl: product.image_url,
  };
  const previewText = buildWhatsAppOrderText(messageOpts);
  const orderUrl = buildWhatsAppOrderUrl(messageOpts);

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(99, q + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            Customize your order, then send it to us on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {product.image_url && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-40 w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Quantity
            </Label>
            <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
              <button
                type="button"
                onClick={dec}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center font-display text-lg font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={inc}
                aria-label="Increase quantity"
                className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <Label
              htmlFor="order-note"
              className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
            >
              Special note (toppings, allergies, message…)
            </Label>
            <Textarea
              id="order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Extra chocolate chips, no nuts, write 'Happy Birthday Sam' on top"
              rows={3}
              className="mt-2 resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Estimated total</span>
            <span className="font-display text-2xl font-semibold text-primary">
              {BAKERY.currency}
              {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Message preview
              </span>
              <span className="text-[10px] text-muted-foreground">
                Sent to WhatsApp
              </span>
            </div>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 font-sans text-xs leading-relaxed text-foreground/90">
{previewText}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-glow hover:shadow-warm"
          >
            <MessageCircle className="h-4 w-4" />
            Send order on WhatsApp
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
