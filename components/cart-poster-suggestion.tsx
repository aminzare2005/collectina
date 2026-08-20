"use client";

import { useEffect, useState } from "react";

import PosterCard from "@/components/poster-card";
import PosterCardSkeleton from "./poster-card-skeleton";

type Product = {
  id: string;
  name: string;
  image_url: string;
};

export default function CartPosterSuggestion() {
  const [posters, setPosters] = useState<Product[]>([]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const res = await fetch("/api/products?type=poster&offset=0&limit=6&feed=true");
        if (res.ok) {
          const data = await res.json();
          setPosters(data);
        }
      } catch {
        // silently fail
      }
    };

    fetchPosters();
  }, []);

  
  return (
    <section className="w-full space-y-3" aria-label="پیشنهاد پوستر">
      <h3 className="text-lg font-bold">پوستر نمیخواستی؟</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
        {posters.length === 0 &&
          Array.from({ length: 6 }).map((_, idx) => (
            <PosterCardSkeleton key={idx} />
          ))}
        {posters.map((poster) => (
          <PosterCard
            key={poster.id}
            href={`/poster/${poster.id}`}
            image_url={poster.image_url}
            name={poster.name}
            size="small"
            quality="low"
          />
        ))}
      </div>
    </section>
  );
}
