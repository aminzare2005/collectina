import type React from "react";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const font = Rubik({
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ویلون فارسی",
    template: "%s | ویلون فارسی",
  },
  description: "OFFICIAL WEBSITE OF @VLONEFARSI IG BRAND",
  keywords: ["VLONEFARSI", "برند", "مرچ", "قاب موبایل", "پوستر"],
  authors: [{ name: "aminzare.me" }],
  creator: "cwpslxck",
  publisher: "VLONEFARSI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vlonefarsi.ir"),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://vlonefarsi.ir",
    title: "ویلون فارسی",
    description: "OFFICIAL WEBSITE OF @VLONEFARSI IG BRAND",
    siteName: "VLONEFARSI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VLONEFARSI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ویلون فارسی",
    description: "OFFICIAL WEBSITE OF @VLONEFARSI IG BRAND",
    images: ["/twitter-image.jpg"],
    creator: "@vlonefarsi",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="enamad" content="33457824" />
      </head>
      <body className={`font-sans ${font.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
