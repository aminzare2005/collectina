export default function StatusLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto max-w-2xl min-h-dvh flex items-center justify-center">
      {children}
    </main>
  );
}
