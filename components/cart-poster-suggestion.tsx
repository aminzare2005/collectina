"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    const supabase = createClient();

    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, image_url")
        .eq("type", "poster")
        .eq("feed", true)
        .order("pin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) {
        setPosters(data);
      }
    };

    fetch();
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
