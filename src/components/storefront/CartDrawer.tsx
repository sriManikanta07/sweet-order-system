import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { BAKERY, buildWhatsAppCartText, buildWhatsAppCartUrl } from "@/config/bakery";
import { useState } from "react";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, updateNote, removeItem, clear, total, count } = useCart();
  const [showPreview, setShowPreview] = useState(false);

  const cartLines = items.map((i) => ({
    productName: i.name,
    quantity: i.quantity,
    price: i.price,
    note: i.note,
    imageUrl: i.image_url,
  }));
  const previewText = buildWhatsAppCartText(cartLines);
  const orderUrl = buildWhatsAppCartUrl(cartLines);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <ShoppingBag className="h-5 w-5" />
            My cart
            {count > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>Review your order, then send it on WhatsApp.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <p className="mt-3 font-display text-lg text-foreground">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add some bakes from the menu to get started.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {BAKERY.currency}
                          {item.price.toLocaleString()} each
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease"
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase"
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-display text-sm font-semibold text-primary">
                        {BAKERY.currency}
                        {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <Textarea
                      value={item.note ?? ""}
                      onChange={(e) => updateNote(item.id, e.target.value)}
                      placeholder="Note (toppings, allergies…)"
                      rows={2}
                      maxLength={300}
                      className="mt-2 resize-none text-xs"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && showPreview && (
            <div className="mt-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Message preview
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-secondary"
                  aria-label="Close preview"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words px-3 py-2 font-sans text-xs leading-relaxed text-foreground/90">
{previewText}
              </pre>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t border-border bg-secondary/30 px-5 py-4">
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order total</span>
                <span className="font-display text-2xl font-semibold text-primary">
                  {BAKERY.currency}
                  {total.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {showPreview ? "Hide" : "Preview"} message
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  Clear cart
                </button>
              </div>
              <a
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-glow hover:shadow-warm"
              >
                <MessageCircle className="h-4 w-4" />
                Order on WhatsApp
              </a>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
