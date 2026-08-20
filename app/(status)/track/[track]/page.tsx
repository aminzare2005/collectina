import TrackPageClient from "@/components/track-page-client";
import { OrderRepository } from "@/lib/repositories";
import { notFound } from "next/navigation";
import React from "react";

export default async function OrderIdPage({
  params,
}: {
  params: Promise<{ track: number }>;
}) {
  const { track } = await params;

  const order = await OrderRepository.getTrackingByTrackId(track);

  if (!order) {
    notFound();
  }
  return <TrackPageClient order={order} />;
}
