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
        "aspect-9/18 w-full relative border border-stone-300",
        props.size === "small" && "rounded-lg",
        props.size === "big" && "rounded-3xl md:rounded-4xl"
      )}
    >
      <div className="flex absolute rounded-full bg-stone-800 border border-stone-900/40 flex-col w-1/3 m-[5%] p-[4%] left-0 top-0">
        <div className="bg-black border border-stone-900 rounded-full w-full aspect-square mb-[10%]"></div>
        <div className="bg-black border border-stone-900 rounded-full w-full aspect-square"></div>
      </div>
    </Skeleton>
  );
}

export default PhonecaseCardSkeleton;
