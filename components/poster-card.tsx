"use client";
import { REALESTIC_TEXTURE_STYLE } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NoiseTexture } from "./ui/noise";

type Props = {
  href?: string;
  image_url?: string;
  name?: string;
  size: "small" | "big";
  quality?: "low" | "high";
  className?: string;
};

const blurDataURL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

function PosterCard(props: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isLink = Boolean(props.href);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const image = (
    <Image
      width={props.size == "big" ? 160 : 100}
      height={props.size == "big" ? 160 : 100}
      src={props.image_url || "/images/poster-default.png"}
      alt={props.name || "پوستر"}
      loading="lazy"
      quality={props.quality == "low" ? 40 : 75}
      draggable="false"
      className={cn(
        "h-full w-full object-cover transition-all duration-500",
        REALESTIC_TEXTURE_STYLE,
        !imageLoaded && "blur",
      )}
      placeholder="blur"
      blurDataURL={blurDataURL}
      onLoad={handleImageLoad}
    />
  );

  return (
    <div
      className={cn(
        props.className,
        "aspect-7/10 relative w-full overflow-hidden rounded-xs bg-background shadow duration-300",
        isLink ? "cursor-pointer" : "pointer-events-none cursor-default",
      )}
    >
      {isLink ? (
        <Link
          href={props.href!}
          className="block h-full w-full"
          draggable="false"
        >
          {image}
        </Link>
      ) : (
        <div className="h-full w-full">{image}</div>
      )}
      <NoiseTexture noiseOpacity={0.4} />
    </div>
  );
}

export default PosterCard;
