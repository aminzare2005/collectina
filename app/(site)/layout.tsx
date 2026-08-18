export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="pt-24 pb-4 px-4">
    {children}
  </div>;
}
