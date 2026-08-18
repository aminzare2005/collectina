"use client";

import { cn } from "@/lib/utils";
import {
  Clock,
  CreditCard,
  PackageSearch,
  Truck,
  CheckCircle2,
  XCircle,
  Undo2,
  RotateCcw,
  X,
} from "lucide-react";

type Status =
  | "pending"
  | "paid"
  | "outofstock"
  | "processing"
  | "ready"
  | "delivered"
  | "returned"
  | "canceled"
  | "refunded";

interface OrderProgressProps {
  status: Status;
}

export default function OrderProgress({ status }: OrderProgressProps) {
  const steps: {
    key: Status;
    label: string;
    color: string;
    icon: React.ElementType;
    hide: boolean;
  }[] = [
    {
      key: "pending",
      label: "در انتظار پرداخت",
      color: "bg-yellow-300",
      icon: CreditCard,
      hide: true,
    },
    {
      key: "paid",
      label: "پرداخت شده",
      color: "bg-green-500",
      icon: Clock,
      hide: false,
    },
    {
      key: "outofstock",
      label: "ناموجود",
      color: "bg-red-400",
      icon: X,
      hide: true,
    },
    {
      key: "processing",
      label: "در حال پردازش",
      color: "bg-blue-400",
      icon: PackageSearch,
      hide: false,
    },
    {
      key: "ready",
      label: "آماده ارسال",
      color: "bg-indigo-400",
      icon: Truck,
      hide: false,
    },
    {
      key: "delivered",
      label: "ارسال شد",
      color: "bg-green-500",
      icon: CheckCircle2,
      hide: false,
    },
    {
      key: "returned",
      label: "مرجوع شده",
      color: "bg-orange-500",
      icon: Undo2,
      hide: true,
    },
    {
      key: "canceled",
      label: "لغو شده",
      color: "bg-red-500",
      icon: XCircle,
      hide: true,
    },
    {
      key: "refunded",
      label: "بازپرداخت شده",
      color: "bg-pink-500",
      icon: RotateCcw,
      hide: true,
    },
  ];

  const activeIndex = steps.findIndex((s) => s.key === status);
  const isActive = (index: number) => index <= activeIndex;

  return (
    <div className="relative w-full flex justify-center py-8">
      <div className="relative flex flex-col gap-4 items-center w-full max-w-2xl">
        {/* خط مرکزی */}
        <div className="flex absolute items-center justify-center top-0 bottom-0 w-1 bg-linear-to-b from-primary/30 via-muted to-transparent rounded-full" />

        {steps.map((step, index) => {
          const active = isActive(index);
          const Icon = step.icon;
          if (step.hide && index !== activeIndex) {
            return;
          }
          return (
            <div
              key={step.key}
              className={cn(
                "relative flex items-center justify-center bg-card border w-full gap-6 py-6 px-4 rounded-2xl transition-all",
                active && "bg-card border",
                active &&
                  index === activeIndex &&
                  `${step.color} border-0! drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`
              )}
            >
              {/* توضیحات مرحله */}
              <div className="flex items-center text-black gap-1">
                {index === activeIndex && <Icon />}
                <span
                  className={cn(
                    "font-semibold text-lg",
                    active ? "text-black" : "text-muted-foreground/70"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
