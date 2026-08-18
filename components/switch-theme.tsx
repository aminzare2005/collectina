"use client";
import { useTheme } from "next-themes";
import { MoonIcon, SunDimIcon } from "lucide-react";

function SwitchTheme() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center hover:bg-foreground/5 rounded-md transition-colors w-full justify-center gap-2 text-lg font-medium py-2 cursor-pointer hoveranim"
    >
      {theme === "light" ? (
        <div className="flex items-center gap-1">
          <MoonIcon className="size-6.5" />
          دارک مود
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <SunDimIcon className="size-7" />
          لایت مود
        </div>
      )}
    </button>
  );
}

export default SwitchTheme;
