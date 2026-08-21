import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  href: string;
  linkLabel?: string;
  children?: ReactNode;
};

export default function HomeSectionHeader({
  title,
  description,
  href,
  linkLabel = "مشاهده همه",
  children,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {children ? (
          children
        ) : (
          <>
            {linkLabel}
            <ArrowLeft className="size-4" aria-hidden />
          </>
        )}
      </Link>
    </div>
  );
}
