import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  HomeIcon,
  LucideSettings,
  ShoppingBasketIcon,
  User,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  function formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.startsWith("989") && cleaned.length === 12) {
      return "0" + cleaned.substring(2);
    }

    if (cleaned.startsWith("09") && cleaned.length === 11) {
      return cleaned;
    }

    return cleaned;
  }

  return (
    <>
      <header className="fixed max-w-2xl h-16 mx-auto flex flex-row items-center gap-0.5 top-4 right-4 left-4 z-20 px-4 backdrop-blur-sm bg-background/50 border border-muted-foreground/20 dark:border-muted-foreground/10 rounded-full">
        <Link href={"/"}>
          <Button variant={"ghost2"} size={"icon"}>
            <HomeIcon className="size-6" />
          </Button>
        </Link>
        <div className="size-10 mx-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
          <UserIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 space-y-0.5 min-w-0">
          <p className="font-semibold text-sm truncate">
            {user?.user_metadata.display_name || "کاربر"}
          </p>
          <p className="text-xs text-foreground/60 truncate">
            {formatPhoneNumber(user.phone || "")}
          </p>
        </div>
        <Link href={"/dashboard/me"}>
          <Button variant={"ghost2"} size={"icon"}>
            <LucideSettings className="size-6" />
          </Button>
        </Link>
        <Link href="/cart">
          <Button variant={"ghost2"} size={"icon"}>
            <ShoppingBasketIcon className="size-6" />
          </Button>
        </Link>
      </header>
      <div className="max-w-2xl mx-auto">{children}</div>
    </>
  );
}
