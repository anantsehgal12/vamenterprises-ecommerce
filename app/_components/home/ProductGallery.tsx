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
      <div className="aspect-w-4 aspect-h-5 w-full overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
        No images available
      </div>
    )
  }

  return (
    <div className="w-full aspect-square">
      {/* Carousel */}
      <div className="relative">
        <Carousel setApi={setApi} className="w-full aspect-square">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id}>
                <div className="aspect-square aspect-h-5 w-full overflow-hidden rounded-lg bg-gray-800">
                  <img
                    src={image.src}
                    alt={image.alt ?? productName}
                    className="h-full w-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => scrollTo(index)}
            className={cn(
              "overflow-hidden rounded-md bg-gray-700 hover:ring-2 focus:outline-none transition-all",
              current === index ? "ring-2 ring-white" : "hover:ring-white/50"
            )}
          >
            <img
              src={image.src}
              alt={image.alt ?? productName}
              className="h-20 w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
