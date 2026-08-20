"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PhonecaseCard from "@/components/phonecaseCard";
import { useInView } from "react-intersection-observer";
import PhonecaseCardSkeleton from "./phonecaseCardSkeleton";
import EmptyCommon from "./empty-common";

type Product = {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
};

type ProductsGridProps = {
  pageSize?: number;
  infinite?: boolean;
};

export default function PhonecaseGrid({
  pageSize = 8,
  infinite = true,
}: ProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);

  const { ref, inView } = useInView({
    rootMargin: "400px",
  });

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    const from = page * pageSize;

    try {
      const res = await fetch(`/api/products?type=phonecase&offset=${from}&limit=${pageSize}&feed=true`);
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
        title="فعلا قاب موبایل نداریم"
        description="به‌زودی طرح‌های جدید اضافه می‌شن"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-12 md:grid-cols-4 mb-0 md:mb-4">
        {products.map((product) => (
          <PhonecaseCard
            key={product.id}
            href={`/phonecase/${product.id}`}
            image_url={product.image_url}
            name={product.name}
            size="big"
          />
        ))}

        {isLoading &&
          Array.from({ length: Math.min(pageSize, 4) }).map((_, idx) => (
            <PhonecaseCardSkeleton size="big" key={idx} />
          ))}
      </div>

      {infinite && <div ref={ref} />}
    </>
  );
}
