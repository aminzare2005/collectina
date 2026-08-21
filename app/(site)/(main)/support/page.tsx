"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import Link from "next/link";

function SupportPage() {
  return (
    <div className="flex flex-col items-center max-w-lg justify-center min-h-[70dvh] mx-auto p-6 gap-6 text-center">
      <div className="absolute top-0 left-0 right-0 bg-linear-to-t from-sky-500/10 to-background h-dvh -z-50" />
      <p className="text-5xl font-extrabold mb-4">پشتیبانی تلگرام</p>

      <p className="opacity-70 text-lg">
        درصورتی که به مشکلی خوردید با پشتیبانی تلگرام در ارتباط باشید تا توی
        سریع‌ترین زمان ممکن مشکلتون حل بشه.
      </p>
      <Link target="_blank" href={"https://t.me/CollectinaShop?direct"}>
        <Button size="lg" dir="ltr" className="gap-1 w-full">
          <Send className="size-4" />
          t.me/CollectinaShop?direct
        </Button>
      </Link>
    </div>
  );
}

export default SupportPage;
