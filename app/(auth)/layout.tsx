import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VLONEFARSI - AUTH",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex justify-center items-center min-h-dvh">{children}</div>;
}
