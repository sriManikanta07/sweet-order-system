// Bakery configuration — edit these to rebrand
export const BAKERY = {
  name: "Hearth & Crumb",
  tagline: "Slow-baked, hand-shaped, made with care",
  // WhatsApp number in international format, digits only (no + or spaces)
  whatsappNumber: "917095658244",
  currency: "₹",
  locationLine: "Daily 8am – 8pm",
} as const;

/**
 * Build a wa.me link with a pre-filled order message.
 * encodeURIComponent prevents injection in the URL.
 */
export type OrderMessageOpts = {
  productName: string;
  quantity?: number;
  price?: number;
  note?: string;
  imageUrl?: string | null;
};

export function buildWhatsAppOrderText(opts: OrderMessageOpts) {
  const qty = Math.max(1, Math.floor(opts.quantity ?? 1));
  const lines = [
    `Hi ${BAKERY.name}! I'd like to place an order:`,
    ``,
    `• Item: ${opts.productName}`,
    `• Quantity: ${qty}`,
  ];
  if (typeof opts.price === "number") {
    lines.push(`• Price: ${BAKERY.currency}${opts.price} each`);
    lines.push(`• Subtotal: ${BAKERY.currency}${(opts.price * qty).toLocaleString()}`);
  }
  if (opts.note && opts.note.trim()) {
    lines.push(`• Note: ${opts.note.trim()}`);
  }
  if (opts.imageUrl) {
    lines.push(`• Image: ${opts.imageUrl}`);
  }
  lines.push(``, `Could you please confirm availability and delivery? Thank you!`);
  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(opts: OrderMessageOpts) {
  const text = encodeURIComponent(buildWhatsAppOrderText(opts));
  return `https://wa.me/${BAKERY.whatsappNumber}?text=${text}`;
}
