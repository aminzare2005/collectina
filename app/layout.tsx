import type React from "react";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const font = Rubik({
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "کالکتینا",
    template: "%s | کالکتینا",
  },
  description: "OFFICIAL WEBSITE OF COLLECTINA",
  keywords: ["collectina", "برند", "مرچ", "قاب موبایل", "پوستر"],
  authors: [{ name: "aminzare.me" }],
  creator: "cwpslxck",
  publisher: "collectina",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://collectina.ir"),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://collectina.ir",
    title: "کالکتینا",
    description: "OFFICIAL WEBSITE OF COLLECTINA",
    siteName: "collectina",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "collectina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "کالکتینا",
    description: "OFFICIAL WEBSITE OF COLLECTINA",
    images: ["/twitter-image.jpg"],
    creator: "collectina",
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
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
