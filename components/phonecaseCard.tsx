"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  href?: string;
  image_url?: string;
  name?: string;
  size: "small" | "big";
  quality?: "low" | "high";
  className?: string;
};

function PhonecaseCard(props: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isLink = Boolean(props.href);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const shellClass = cn(
    props.className,
    "aspect-9/18 w-full shadow border border-muted-foreground/20 dark:border-muted-foreground/10 duration-300 bg-stone-200 dark:bg-stone-900 overflow-hidden relative",
    props.size === "small" && "rounded-lg",
    props.size === "big" && "rounded-3xl md:rounded-4xl",
    isLink ? "cursor-pointer" : "pointer-events-none cursor-default",
  );

  const inner = (
    <>
      <div className="absolute inset-0">
        <Image
          width={props.size == "big" ? 160 : 100}
          height={props.size == "big" ? 160 : 100}
          src={props.image_url || "/images/card-default.png"}
          alt={props.name || "قاب موبایل"}
          loading="lazy"
          quality={props.quality == "low" ? 40 : 75}
          draggable="false"
          className={cn(
            "h-full w-full object-cover transition-all duration-500 brightness-90",
            !imageLoaded && "blur",
          )}
          onLoad={handleImageLoad}
        />
      </div>

      <div className="absolute left-0 top-0 m-[5%] flex w-1/3 flex-col rounded-full border border-stone-900/40 bg-stone-800 p-[4%] transition-all duration-500">
        <div className="mb-[10%] aspect-square w-full rounded-full border border-stone-900 bg-black" />
        <div className="aspect-square w-full rounded-full border border-stone-900 bg-black" />
      </div>
    </>
  );

  if (isLink) {
    return (
      <div className={shellClass}>
        <Link className="block h-full w-full" href={props.href!} draggable="false">
          {inner}
        </Link>
      </div>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}

export default PhonecaseCard;
