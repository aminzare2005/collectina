import PosterGrid from "@/components/poster-grid";

export default async function PosterPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">پوسترها</h1>
        <p className="text-sm text-muted-foreground">
          طرح‌های دیواری آماده سفارش
        </p>
      </div>
      <PosterGrid />
    </div>
  );
}
