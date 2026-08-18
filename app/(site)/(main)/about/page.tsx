import { DisplayVersion } from "@/components/display-version";
import { Button } from "@/components/ui/button";
import { BotIcon, GlobeIcon, InstagramIcon, SendIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-4">
      <main className="w-full max-w-4xl">
        <div className="grid sm:grid-cols-2 gap-12 items-center">
          <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center order-first sm:order-last">
            <h1 className="text-5xl text-center font-black tracking-tighter dark:opacity-10 opacity-20">
              VLONE
              <br />
              FARSI
            </h1>
            <Image
              src="/images/logo.svg"
              alt="Logo"
              height={60}
              width={60}
              className="dark:invert size-20 invert-0 dark:opacity-10 opacity-20"
            />
          </div>

          {/* ستون دوم: متن محتوا */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">داستان ما</h2>
            {/* <div className="space-y-4 text-muted-foreground leading-7">
              <p>
                برند <strong className="text-foreground">کالکتینا</strong>{" "}
                اوایل سال ۲۰۲۴ با هدف عرضه محصولاتی منحصر به فرد تاسیس شد. اسم
                ما از برند VLONE در نیویورک الهام گرفته شده که انقلابی در صنعت
                موسیقی و فشن ایجاد کرد.
              </p>
              <p>
                پس از اون در میانه سال ۲۰۲۵ وبسایت خودمون را راه‌اندازی کردیم و
                در اوایل ۲۰۲۶، با وجود مشکلات مختلف، سری جدیدی از پوسترها رو
                منتشر کردیم.
              </p>
              <p className="font-semibold text-foreground">
                ممنونیم که در این مسیر کنار ما هستید.
              </p>
            </div> */}

            {/* لینک های ارتباطی */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="https://instagram.com/collectina" target="_blank">
                <Button variant="outline" className="gap-2">
                  <InstagramIcon className="w-4 h-4" /> اینستاگرام
                </Button>
              </Link>
              <Link href="https://t.me/collectina" target="_blank">
                <Button variant="outline" className="gap-2">
                  <SendIcon className="w-4 h-4" /> تلگرام
                </Button>
              </Link>
              <Link href="/support" target="_blank">
                <Button variant="outline" className="gap-2">
                  <GlobeIcon className="w-4 h-4" /> پشتیبانی
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* فوتر استاندارد */}
      <footer className="mt-24 text-center text-xs text-muted-foreground">
        <div dir="ltr">
          © {new Date().getFullYear()} COLLECTINA • <DisplayVersion />
        </div>
        <Link
          href="https://aminzare.me"
          target="_blank"
          className="inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity mt-2"
        >
          <BotIcon className="w-3 h-3" />
          <span dir="ltr">Developed by aminzare.me</span>
        </Link>
      </footer>
    </div>
  );
}
