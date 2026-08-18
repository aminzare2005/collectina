import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant: "poster" | "phonecase";
  children: ReactNode;
};

export function ProductVisualStage({ variant, children }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        variant === "poster" &&
          "max-w-[17.5rem] sm:max-w-[19rem] md:max-w-[16rem] lg:max-w-[18rem]",
        variant === "phonecase" &&
          "max-w-[13rem] sm:max-w-[14.5rem] md:max-w-[15rem] lg:max-w-[16rem]",
      )}
    >
      {children}
    </div>
  );
}
