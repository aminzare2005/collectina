import { Megaphone } from "lucide-react";

type Props = {
  text: string;
};

export default function TopBanner({ text }: Props) {
  const message = text.trim();
  if (!message) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3.5 text-indigo-950"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
        <Megaphone className="size-4" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-sm leading-relaxed font-medium whitespace-pre-wrap">
        {message}
      </p>
    </div>
  );
}
