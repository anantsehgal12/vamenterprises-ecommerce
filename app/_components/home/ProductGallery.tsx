"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

interface Image {
  id: string | number
  src: string
  alt: string
}

interface ProductGalleryProps {
  images: Image[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = (index: number) => {
    api?.scrollTo(index)
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-zinc-500">
        No images available
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Carousel */}
      <div className="relative">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900">
                  <img
                    src={image.src}
                    alt={image.alt ?? productName}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-4 border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-[#4ca626] hover:bg-[#4ca626] hover:text-black" />
              <CarouselNext className="right-4 border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-[#4ca626] hover:bg-[#4ca626] hover:text-black" />

              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-zinc-300 backdrop-blur-md">
                {current + 1} / {images.length}
              </div>
            </>
          )}
        </Carousel>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "aspect-square overflow-hidden rounded-xl border bg-zinc-900 transition-all duration-300 focus:outline-none",
                current === index
                  ? "border-[#4ca626] shadow-[0_0_0_2px_rgba(76,166,38,0.35)]"
                  : "border-white/10 opacity-60 hover:border-white/30 hover:opacity-100"
              )}
            >
              <img
                src={image.src}
                alt={image.alt ?? productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}