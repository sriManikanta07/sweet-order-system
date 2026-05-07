import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
};

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [
      Autoplay({
        delay: 5500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <section className="container-bakery pt-6">
      <div className="relative overflow-hidden rounded-2xl shadow-card">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {banners.map((b, i) => {
              const Inner = (
                <div className="relative h-[42vh] min-h-[280px] w-full sm:h-[55vh] sm:min-h-[420px]">
                  <img
                    src={b.image_url}
                    alt={b.title ?? "Bakery feature"}
                    className={cn(
                      "h-full w-full object-cover",
                      i === selected && "animate-slow-zoom",
                    )}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-overlay" />
                  {b.title && (
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-12">
                      <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-white  text-balance sm:text-5xl">
                        {b.title}
                      </h2>
                    </div>
                  )}
                </div>
              );
              return (
                <div className="min-w-0 flex-[0_0_100%]" key={b.id}>
                  {b.link_url ? (
                    <a
                      href={b.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {Inner}
                    </a>
                  ) : (
                    Inner
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-soft backdrop-blur transition-all hover:bg-card hover:scale-105 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground shadow-soft backdrop-blur transition-all hover:bg-card hover:scale-105 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:bottom-5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full bg-card/60 transition-all",
                    i === selected ? "w-8 bg-card" : "w-1.5 hover:bg-card/90",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
