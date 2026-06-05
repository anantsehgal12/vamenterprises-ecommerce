"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Announcement {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcement");
        if (response.ok) {
          const data = await response.json();
          // Sort by newest first
          const sorted = data.sort((a: Announcement, b: Announcement) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAnnouncements(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading || announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#111111] border-b border-white/10 py-2.5 relative z-50">
      <div className="container mx-auto px-10 relative">
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {announcements.map((announcement) => (
              <CarouselItem key={announcement.id}>
                <div className="flex items-center justify-center gap-3 h-10">
                  <Megaphone className="h-4 w-4 text-[#7ddc56] shrink-0" />
                  <div 
                    className="text-md font-medium text-zinc-200 line-clamp-1 px-2 [&_p]:inline [&_a]:text-[#4ca626] [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{ __html: announcement.message }}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {announcements.length > 1 && (
            <>
              <CarouselPrevious className="absolute -left-2 md:-left-6 h-6 w-6 bg-transparent border-white/20 text-white hover:bg-white/10" />
              <CarouselNext className="absolute -right-2 md:-right-6 h-6 w-6 bg-transparent border-white/20 text-white hover:bg-white/10" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
