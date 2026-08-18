import PhonecaseGrid from "@/components/phonecase-grid";

export default async function PhonecasePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          قاب موبایل
        </h1>
        <p className="text-sm text-muted-foreground">
          طرح‌های آماده برای گوشی‌های مختلف
        </p>
      </div>
      <PhonecaseGrid />
    </div>
  );
}
