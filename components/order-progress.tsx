"use client";

import { cn } from "@/lib/utils";
import { TIMELINE_STEPS, toOrderStatus, getStatusBadgeClass, getStatusTextClass } from "@/lib/types/order-status";
import type { OrderStatus } from "@/lib/types/order-status";
import { Check } from "lucide-react";

interface OrderProgressProps {
  status: OrderStatus | string;
}

export default function OrderProgress({ status }: OrderProgressProps) {
  const steps = TIMELINE_STEPS;
  const currentIdx = steps.findIndex((s) => s.key === status);
  const os = toOrderStatus(status);

  return (
    <div className="w-full py-2">
      {steps.map((step, index) => {
        const isDone = index < currentIdx;
        const isCurrent = index === currentIdx && os === step.key;

        if (step.hide && !isCurrent) return null;

        const Icon = step.icon;
        const nextVisible = steps
          .slice(index + 1)
          .find((s) => !s.hide || steps.indexOf(s) === currentIdx);
        const isLastVisible = !nextVisible;

        return (
          <div key={step.key}>
            {/* Single row: icon + label aligned */}
            <div className="flex items-center gap-3">
              {/* Icon dot */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center size-8 rounded-full border-2 shrink-0 transition-all duration-300",
                  isDone && "border-emerald-500 bg-emerald-500/10",
                  isCurrent && cn(getStatusBadgeClass(step.key), "border-transparent"),
                  !isDone && !isCurrent && "border-border bg-background",
                )}
              >
                {isDone ? (
                  <Check
                    className="size-3.5 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={3}
                  />
                ) : (
                  <Icon
                    className={cn(
                      "size-3.5",
                      isCurrent ? getStatusTextClass(step.key) : "text-muted-foreground/50",
                    )}
                  />
                )}
                {isCurrent && (
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full animate-ping opacity-20",
                      getStatusBadgeClass(step.key),
                    )}
                  />
                )}
              </div>

              {/* Label — same row, vertically centered with icon */}
              <span
                className={cn(
                  "text-sm leading-none",
                  isDone &&
                    "text-emerald-700 dark:text-emerald-400 font-medium",                    isCurrent && cn(getStatusTextClass(step.key), "font-semibold"),
                  !isDone &&
                    !isCurrent &&
                    "text-muted-foreground/50 font-normal",
                )}
              >
                {step.label}
                {isCurrent && (
                  <span className="text-xs font-normal text-muted-foreground mr-1.5">
                    · فعلی
                  </span>
                )}
                {isDone && (
                  <span className="text-xs font-normal text-emerald-600/40 dark:text-emerald-400/40 mr-1.5">
                    · تکمیل
                  </span>
                )}
              </span>
            </div>

            {/* Connector line */}
            {!isLastVisible && (
              <div className="flex">
                <div className="flex flex-col items-center w-8">
                  <div
                    className={cn(
                      "w-0.5 h-5",
                      isDone ? "bg-emerald-500/40" : "bg-border",
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
