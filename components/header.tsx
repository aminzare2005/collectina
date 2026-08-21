"use client";

import Link from "next/link";
import { ShoppingBasketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { MENU_ITEMS } from "@/constants";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const timeout = setTimeout(() => {
      setIsMenuOpen(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    const fetchCartCount = async () => {
      try {
        // /api/cart/count already returns { count: 0 } for anonymous users,
        // so no need for a separate session round trip first.
        const res = await fetch("/api/cart/count");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCartCount(data.count ?? 0);
        }
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };

    fetchCartCount();

    const onFocus = () => fetchCartCount();
    const onCartUpdated = () => fetchCartCount();
    window.addEventListener("focus", onFocus);
    window.addEventListener("cart-updated", onCartUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, [pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header
        className={cn(
          "fixed max-w-xl h-16 mx-auto flex flex-row items-center gap-2 top-4 right-4 left-4 z-99999 px-4 backdrop-blur-sm bg-background/70 border border-muted-foreground/20 rounded-2xl",
          isMenuOpen && "bg-transparent backdrop-blur-none border-transparent!",
        )}
      >
        <div className="flex w-full h-16 items-center justify-between">
          <div className="inline-flex items-center gap-1">
            <Button
              onClick={toggleMenu}
              className="relative flex items-center justify-center group cursor-pointer hover:bg-transparent!"
              aria-label="Menu"
              variant={"ghost"}
              size={"icon"}
            >
              <span
                className={cn(
                  "absolute w-5 h-0.5 bg-foreground rounded-full transition-all duration-300",
                  isMenuOpen
                    ? "rotate-45 translate-y-0"
                    : "-translate-y-1.5 group-hover:-translate-y-2",
                )}
              ></span>
              <span
                className={cn(
                  "absolute w-5 h-0.5 bg-foreground rounded-full transition-all duration-300",
                  isMenuOpen
                    ? "opacity-0 scale-x-0"
                    : "opacity-100 group-hover:scale-x-95",
                )}
              ></span>
              <span
                className={cn(
                  "absolute w-5 h-0.5 bg-foreground rounded-full transition-all duration-300",
                  isMenuOpen
                    ? "-rotate-45 translate-y-0"
                    : "translate-y-1.5 group-hover:translate-y-2",
                )}
              ></span>
            </Button>
          </div>
          <Link
            href="/"
            draggable="false"
            className="flex items-center gap-1.5 font-bold text-lg"
          >
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="size-6"
              draggable="false"
            />
            <h1>کالکتینا</h1>
          </Link>

          <div className="flex gap-0.5 items-center relative">
            <Link
              href="/cart"
              draggable="false"
              aria-label={`سبد خرید${cartCount ? `، ${cartCount} آیتم` : ""}`}
            >
              <Button variant={"ghost"} size={"icon"} className="relative">
                <ShoppingBasketIcon className="size-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background">
                    {cartCount > 9
                      ? "۹+"
                      : new Intl.NumberFormat("fa-IR").format(cartCount)}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <div className="fixed inset-0 z-99998">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          <div
            className={`absolute top-0 left-0 w-full transition-transform duration-200 ${
              isMenuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            <div className="flex flex-col px-6 pt-24 gap-2 max-w-xl mx-auto">
              {MENU_ITEMS.map((item) => {
                const isCurrentPage = item.href === pathname;

                return isCurrentPage ? (
                  <button
                    key={item.href}
                    onClick={() =>
                      setTimeout(() => {
                        setIsMenuOpen(false);
                      }, 200)
                    }
                    className="flex items-center cursor-pointer hover:bg-foreground/5 rounded-md transition-colors w-full justify-center gap-2 text-lg font-medium py-2 hoveranim"
                  >
                    {item.title}
                    {item.new && (
                      <div className="bg-violet-500/60 rounded-lg text-sm flex items-center gap-1 py-0.5 px-1.5 animate-pulse">
                        جدید
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    draggable="false"
                    className={cn(
                      "flex items-center hover:bg-foreground/5 rounded-md transition-colors w-full justify-center gap-2 text-lg font-medium py-2 hoveranim",
                      item.disabled && "opacity-50 pointer-events-none",
                    )}
                  >
                    {item.title}
                    {item.new && (
                      <div className="bg-violet-500/60 rounded-lg text-sm flex items-center gap-1 py-0.5 px-1.5 animate-pulse">
                        جدید
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
