import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

function Banner2() {
  return (
    <Link
      href="/phonecase/custom"
      className="
      w-full aspect-video md:aspect-4/1
        rounded-3xl md:rounded-4xl
        flex items-center justify-center
        bg-linear-to-br from-violet-700 via-violet-700/40 to-violet-700
        overflow-hidden relative text-white
      "
    >
      {/* Motion Blur Glow */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-3xl" />

      {/* Content */}
      <div className="relative flex flex-col items-center text-center gap-2 p-4">
        <div className="flex items-center gap-2 text-2xl md:text-4xl font-extrabold">
          <span>قاب موبایل با طرح دلخواه</span>
        </div>

        <p className="text-sm md:text-lg opacity-90">
          علاوه بر قاب‌هایی که پایین میبینی،

          میتونی طرح دلخواه خودتو هم آپلود کنی تا ما برات آماده کنیم :)
        </p>

        <Button variant={'default'}>ساخت قاب کاستوم
          <ArrowLeft />
        </Button>
      </div>
    </Link>
  );
}

export default Banner2;
