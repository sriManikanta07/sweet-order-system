import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BAKERY } from "@/config/bakery";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

type LineItem = { name: string; qty: number; price: number };

/**
 * Parse `product_details` to attempt to extract per-line items.
 * Supports formats like:
 *   "1× Sourdough loaf @450"
 *   "2x Almond croissant - 180"
 *   "Sourdough loaf x1 ₹450"
 * Falls back to a single line using order totals.
 */
function parseItems(order: Order): LineItem[] {
  const text = order.product_details ?? "";
  const lines = text
    .split(/\r?\n|,(?![^()]*\))/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: LineItem[] = [];
  for (const line of lines) {
    // qty leading: "2× Item @price" or "2x Item - price"
    const m1 = line.match(/^(\d+)\s*[×x]\s*(.+?)(?:\s*[-@₹$]\s*([\d.,]+))?$/i);
    // qty trailing: "Item ×2 @price"
    const m2 = line.match(/^(.+?)\s*[×x]\s*(\d+)(?:\s*[-@₹$]\s*([\d.,]+))?$/i);
    if (m1) {
      parsed.push({
        name: m1[2].trim(),
        qty: Number(m1[1]) || 1,
        price: m1[3] ? Number(m1[3].replace(/,/g, "")) : 0,
      });
    } else if (m2) {
      parsed.push({
        name: m2[1].trim(),
        qty: Number(m2[2]) || 1,
        price: m2[3] ? Number(m2[3].replace(/,/g, "")) : 0,
      });
    } else {
      parsed.push({ name: line, qty: 0, price: 0 });
    }
  }

  // If no prices were detected, fall back to a single item using totals
  const subtotalDetected = parsed.reduce((s, l) => s + l.qty * l.price, 0);
  if (subtotalDetected === 0) {
    return [
      {
        name: text || "Order",
        qty: order.quantity || 1,
        price:
          (order.quantity || 1) > 0
            ? Number(order.total_amount) / (order.quantity || 1)
            : Number(order.total_amount),
      },
    ];
  }
  return parsed;
}

export function InvoiceDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const items = parseItems(order);
  const subtotal = items.reduce((s, l) => s + l.qty * l.price, 0);
  const total = Number(order.total_amount);
  const advance = Number(order.advance_paid);
  const balance = Math.max(0, total - advance);
  // If parsed subtotal doesn't reconcile with total, treat the difference as adjustments
  const adjustment = +(total - subtotal).toFixed(2);

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Invoice ${order.order_code}</title>
<meta charset="utf-8" />
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#fff;padding:32px}
  .invoice{max-width:780px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:18px}
  .brand{font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:.5px}
  .tag{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin-top:4px}
  .meta{text-align:right;font-size:12px;color:#444;line-height:1.6}
  .meta .num{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#111;font-weight:600}
  h2{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#666;margin:24px 0 8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .box{font-size:13px;line-height:1.55}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
  th{text-align:left;font-weight:600;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#666;border-bottom:1px solid #111;padding:8px 6px}
  td{padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top}
  td.r,th.r{text-align:right}
  .totals{margin-top:12px;margin-left:auto;width:300px;font-size:13px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0}
  .totals .row.grand{border-top:2px solid #111;border-bottom:2px solid #111;margin-top:6px;padding:10px 0;font-weight:700;font-size:15px}
  .totals .row.due{font-weight:600;color:#b91c1c}
  .notes{margin-top:24px;font-size:12px;color:#444;padding:12px;background:#f7f5f0;border-left:3px solid #111}
  .foot{margin-top:36px;padding-top:14px;border-top:1px dashed #bbb;text-align:center;font-size:11px;color:#666;letter-spacing:.06em}
  .pill{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:3px 8px;border-radius:99px;border:1px solid #111;margin-left:6px}
  @media print{body{padding:0}}
</style></head><body><div class="invoice">${node.innerHTML}</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();},150);};</script>
</body></html>`);
    w.document.close();
  };

  const fmt = (n: number) => `${BAKERY.currency}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Invoice preview
            </div>
            <div className="font-mono text-xs text-foreground">{order.order_code}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} size="sm">
              <Printer className="mr-1.5 h-4 w-4" />
              Print invoice
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Printable area — styled to mirror print output */}
        <div className="bg-muted/40 p-6">
          <div
            ref={printRef}
            className="mx-auto max-w-[780px] bg-white p-8 text-[#111] shadow-lg"
            style={{ fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <div
                  style={{ fontFamily: "Georgia, serif" }}
                  className="text-[26px] font-bold tracking-wide"
                >
                  {BAKERY.name}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {BAKERY.tagline}
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  {BAKERY.locationLine} · +{BAKERY.whatsappNumber}
                </div>
              </div>
              <div className="text-right text-xs leading-relaxed text-neutral-700">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Invoice
                </div>
                <div className="font-mono text-[13px] font-semibold text-black">
                  {order.order_code}
                </div>
                <div className="mt-1">
                  Issued {new Date(order.created_at).toLocaleDateString("en-IN")}
                </div>
                <div>
                  Delivery {new Date(order.delivery_date).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>

            {/* Bill to + Delivery */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Bill to
                </div>
                <div className="mt-2 text-sm leading-relaxed">
                  <div className="font-semibold text-black">{order.customer_name}</div>
                  <div>{order.phone_number}</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Fulfilment
                </div>
                <div className="mt-2 text-sm leading-relaxed">
                  <div className="capitalize">
                    {order.delivery_type}
                    <span className="ml-2 inline-block rounded-full border border-black px-2 py-[2px] text-[10px] uppercase tracking-[0.14em]">
                      {order.order_status}
                    </span>
                  </div>
                  <div>
                    On {new Date(order.delivery_date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Items
            </div>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                  <th className="py-2 text-left font-semibold">Description</th>
                  <th className="py-2 text-right font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Rate</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-neutral-200 align-top">
                    <td className="py-2.5 pr-2">{it.name}</td>
                    <td className="py-2.5 text-right">{it.qty || "—"}</td>
                    <td className="py-2.5 text-right">{it.price ? fmt(it.price) : "—"}</td>
                    <td className="py-2.5 text-right font-medium">
                      {it.qty && it.price ? fmt(it.qty * it.price) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto mt-3 w-[300px] text-sm">
              {subtotal > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-neutral-600">Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
              )}
              {Math.abs(adjustment) > 0.01 && subtotal > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-neutral-600">
                    {adjustment > 0 ? "Delivery / extras" : "Discount"}
                  </span>
                  <span>{fmt(adjustment)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-y-2 border-black py-2.5 text-[15px] font-bold">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-600">Advance paid</span>
                <span>{fmt(advance)}</span>
              </div>
              <div
                className="flex justify-between py-1.5 font-semibold"
                style={{ color: balance > 0 ? "#b91c1c" : "#047857" }}
              >
                <span>{balance > 0 ? "Balance due" : "Paid in full"}</span>
                <span>{fmt(balance)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-6 border-l-[3px] border-black bg-[#f7f5f0] p-3 text-xs text-neutral-700">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Notes
                </div>
                {order.notes}
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 border-t border-dashed border-neutral-400 pt-3 text-center text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Thank you for ordering from {BAKERY.name}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
