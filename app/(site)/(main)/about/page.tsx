import { DisplayVersion } from "@/components/display-version";
import HomeSectionHeader from "@/components/home-section-header";
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
            <Image
              draggable="false"
              src="/images/logo.svg"
              alt="Logo"
              height={60}
              width={60}
              className="size-28 invert-0 opacity-20"
            />
          </div>

          {/* ستون دوم: متن محتوا */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">داستان ما</h2>
            <div className="space-y-4 text-muted-foreground leading-7">
              <p>کالکتینا تازه اول راهشه🫶🏻</p>
            </div>

            <div className="flex gap-2">
              <Link href="https://instagram.com/collectina" target="_blank"  className="w-full">
                <Button variant="outline" className="gap-2 w-full">
                  <InstagramIcon className="w-4 h-4" /> اینستاگرام
                </Button>
              </Link>
              <Link href="https://t.me/collectina" target="_blank" className="w-full">
                <Button variant="outline" className="gap-2 w-full">
                  <SendIcon className="w-4 h-4" /> تلگرام
                </Button>
              </Link>
              <Link href="/support" target="_blank" className="w-full">
                <Button variant="outline" className="gap-2 w-full">
                  <GlobeIcon className="w-4 h-4" /> پشتیبانی
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <HomeSectionHeader title="تایم لاین اتفاقات" href="/" children />
          <ul className="flex flex-col-reverse gap-2 text-muted-foreground leading-7 mt-2">
            <li className="rounded-lg py-1 px-2 bg-muted">
              <span className="font-mono font-semibold">1405/5/26</span> - شروع توسعه وبسایت
              از سورس کد ویلون فارسی (vlonefarsi.ir)
            </li>
            <li className="rounded-lg py-1 px-2 bg-muted">
              <span className="font-mono font-semibold">1405/5/27</span> - خرید دامنه کالکتینا
              دات آی آر
            </li>
          </ul>
        </div>
      </main>

      {/* فوتر استاندارد */}
      <footer className="mt-6 text-center text-xs text-muted-foreground">
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
