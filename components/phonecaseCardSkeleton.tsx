import { cn } from "@/lib/utils";
import React from "react";
import { Skeleton } from "./ui/skeleton";

type Props = {
  size: "small" | "big";
};

function PhonecaseCardSkeleton(props: Props) {
  return (
    <Skeleton
      className={cn(
        "aspect-9/18 w-full relative",
        props.size === "small" && "rounded-lg",
        props.size === "big" && "rounded-3xl md:rounded-4xl",
      )}
    />
  );
}

export default PhonecaseCardSkeleton;
