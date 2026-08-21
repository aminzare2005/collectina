"use client";

import { useEffect, useState } from "react";

import PosterCard from "@/components/poster-card";
import PosterCardSkeleton from "./poster-card-skeleton";
import HomeSectionHeader from "./home-section-header";

type Product = {
  id: string;
  name: string;
  image_url: string;
};

export default function CartPosterSuggestion() {
  const [posters, setPosters] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const res = await fetch(
          "/api/products?type=poster&offset=0&limit=6&feed=true",
        );
        if (res.ok) {
          const data = await res.json();
          setPosters(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchPosters();
  }, []);

  if (posters.length === 0 && !loading) {
    return null;
  }

  return (
    <section className="w-full space-y-3" aria-label="پیشنهاد پوستر">
      <HomeSectionHeader title="چیز دیگه ای نمیخواستی؟" href="/poster" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
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
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <PosterCardSkeleton key={idx} />
          ))}
      </div>
    </section>
  );
}
