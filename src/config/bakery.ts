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
export function buildWhatsAppOrderUrl(opts: {
  productName: string;
  quantity?: number;
  price?: number;
  note?: string;
}) {
  const qty = Math.max(1, Math.floor(opts.quantity ?? 1));
  const lines = [
    `Hi ${BAKERY.name}! I'd like to place an order:`,
    ``,
    `• Item: ${opts.productName}`,
    `• Quantity: ${qty}`,
  ];
  if (typeof opts.price === "number") {
    lines.push(`• Price: ${BAKERY.currency}${opts.price} each`);
  }
  if (opts.note && opts.note.trim()) {
    lines.push(`• Note: ${opts.note.trim()}`);
  }
  lines.push(``, `Could you please confirm availability and delivery? Thank you!`);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${BAKERY.whatsappNumber}?text=${text}`;
}
