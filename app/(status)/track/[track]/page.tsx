import TrackPageClient from "@/components/track-page-client";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import React from "react";

export default async function OrderIdPage({
  params,
}: {
  params: Promise<{ track: number }>;
}) {
  const { track } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      id,
      track_id,
      track_post_id,
      total_amount,
      created_at,
      status,
      order_items (
        products (
          image_url,
          type
        )
      )
    `
    )
    .eq("track_id", track)
    .single();

  if (!order) {
    notFound();
  }
  return <TrackPageClient order={order} />;
}
