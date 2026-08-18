"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function SupportPage() {
  return (
    <div className="flex flex-col items-center max-w-lg justify-center min-h-[70dvh] mx-auto p-6 gap-6 text-center">
      <div className="absolute top-0 left-0 right-0 bg-linear-to-t dark:from-sky-500/5 from-sky-500/20 to-background h-dvh -z-50" />
      <p className="text-5xl font-extrabold mb-4">پشتیبانی تلگرام</p>

      <p className="opacity-70 text-lg">
        درصورتی که به مشکلی خوردید با پشتیبانی تلگرام در ارتباط باشید تا توی
        سریع‌ترین زمان ممکن مشکلتون حل بشه.
      </p>
      <Link target="_blank" href={"https://t.me/collectina?direct"}>
        <Button size="lg" dir="ltr" className="gap-0.5 w-full">
          <Image
            src={"/images/logo.svg"}
            alt="Logo"
            height={40}
            width={40}
            className="size-4"
          />
          t.me/collectina?direct
        </Button>
      </Link>
    </div>
  );
}

export default SupportPage;
