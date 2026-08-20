"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import EmptyCommon from "./empty-common";
import PosterCard from "./poster-card";
import PosterCardSkeleton from "./poster-card-skeleton";

type Product = {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
};

type PosterGridProps = {
  pageSize?: number;
  infinite?: boolean;
};

export default function PosterGrid({
  pageSize = 4,
  infinite = true,
}: PosterGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);

  const { ref, inView } = useInView({
    rootMargin: "500px",
  });

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    const from = page * pageSize;

    try {
      const res = await fetch(`/api/products?type=poster&offset=${from}&limit=${pageSize}&feed=true`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      if (!data || data.length < pageSize) {
        setHasMore(false);
      }

      if (data && data.length > 0) {
        setProducts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [page, pageSize, hasMore]);

  // initial load
  useEffect(() => {
    if (products.length === 0) {
      fetchMore();
    }
  }, [fetchMore, products.length]);

  // infinite scroll
  useEffect(() => {
    if (infinite && inView) {
      fetchMore();
    }
  }, [inView, fetchMore, infinite]);

  if (!isLoading && products.length === 0) {
    return (
      <EmptyCommon
        title="فعلا پوستری نداریم"
        description="به‌زودی طرح‌های جدید اضافه می‌شن"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-12 md:grid-cols-4 mb-0 md:mb-4">
        {products.map((product) => (
          <PosterCard
            key={product.id}
            href={`/poster/${product.id}`}
            image_url={product.image_url}
            size="small"
            name={product.name}
          />
        ))}

        {isLoading &&
          Array.from({ length: pageSize }).map((_, idx) => (
            <PosterCardSkeleton key={idx} />
          ))}
      </div>

      {infinite && <div ref={ref} />}
    </>
  );
}
