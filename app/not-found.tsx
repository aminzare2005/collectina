"use client";

import Link from "next/link";
import Header from "@/components/header";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="relative min-h-dvh w-full flex flex-col items-center justify-center overflow-hidden text-center">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 flex flex-col items-center space-y-6"
        >
          <motion.h1
            className="text-8xl md:text-9xl font-black text-foreground"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            404
          </motion.h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-md">
            اگه دنبال چیز خاصی میگردی یا
            <br />
            به کمک نیاز داری با ما درتماس باش :(
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href="/" className="group">
              <Button
                variant={"default"}
                size="lg"
                className="text-base bg-gradient-to-r bg-foreground text-background transition-all"
              >
                برگشت به صفحه اصلی
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" size="lg" className="text-base">
                تماس با پشتیبانی
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
