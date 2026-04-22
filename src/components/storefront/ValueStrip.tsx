import { Wheat, Clock, Heart } from "lucide-react";

const items = [
  {
    icon: Wheat,
    title: "Single-origin flour",
    body: "Stone-milled grains from local farms — never bleached, never enriched.",
  },
  {
    icon: Clock,
    title: "Slow fermentation",
    body: "Most loaves rise for 18–24 hours. Better flavour, easier to digest.",
  },
  {
    icon: Heart,
    title: "Made by hand",
    body: "Every cake is shaped, decorated, and finished by a real baker.",
  },
] as const;

export function ValueStrip() {
  return (
    <section id="about" className="container-bakery py-20">
      <div className="grid gap-10 sm:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.title}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
              <item.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
