import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

export function StatCard({
  icon,
  title,
  value,
  gradient = "from-blue-500 to-blue-600",
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  gradient?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardContent className="px-6">
        <div className="flex flex-col gap-4 items-center justify-center">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center text-white bg-linear-to-r",
              gradient,
            )}
          >
            {icon}
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
