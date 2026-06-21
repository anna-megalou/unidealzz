import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface BrandCarouselProps {
  brands: string[];
}

const BrandCarousel = ({ brands }: BrandCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#FCF8FE] to-transparent md:w-24" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#FCF8FE] to-transparent md:w-24" />

      <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex items-center select-none">
          {brands.map((brand, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={brand}
                className="flex shrink-0 grow-0 basis-1/3 items-center justify-center px-2 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
              >
                <span
                  className={cn(
                    "rounded-xl px-4 py-3 font-display text-base md:text-lg font-bold tracking-[0.2em] transition-all duration-300",
                    isActive
                      ? "scale-110 text-primary"
                      : "text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  {brand}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {brands.map((brand, index) => (
          <span
            key={brand}
            aria-hidden
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default BrandCarousel;
