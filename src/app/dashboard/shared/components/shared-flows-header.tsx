"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const cn = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const shadow = dark
    ? "shadow-[6px_6px_0px_#172554]" // slate-900
    : "shadow-[6px_6px_0px_#0f172a]"; // slate-950
  return { dark, shadow };
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dark, shadow } = useCartoon();
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "h-12 w-12 border-[4px] rounded-xl transition-all duration-150",
        shadow,
        dark
          ? "bg-[#1e293b] border-blue-600 text-amber-300 hover:bg-[#334155]"
          : "bg-white border-slate-900 text-blue-600 hover:bg-blue-50"
      )}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {dark ? (
        <Sun className="h-6 w-6 text-amber-400 transition-all duration-150" />
      ) : (
        <Moon className="h-6 w-6 text-blue-500 transition-all duration-150" />
      )}
    </Button>
  );
}

export function CollaborationsTopBar() {
  const { dark, shadow } = useCartoon();

  return (
    <div
      className={cn(
        "sticky top-0 z-30 w-full border-b-[4px] px-4 py-3 backdrop-blur-lg",
        shadow,
        dark
          ? "bg-[#1e293b]/90 border-blue-700"
          : "bg-white/90 border-blue-900"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* back button */}
        <Link href="/dashboard" passHref>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 border-[4px] rounded-xl mr-2 transition-all duration-150",
              shadow,
              dark
                ? "bg-[#1e293b] border-blue-700 text-blue-200 hover:bg-blue-900"
                : "bg-white border-blue-900 text-blue-700 hover:bg-blue-50"
            )}
            title="Volver al dashboard"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>

        {/* title */}
        <h1
          className={cn(
            "text-2xl font-extrabold tracking-tight flex-1 select-none",
            dark
              ? "text-emerald-200"
              : "text-blue-900"
          )}
        >
          My Shares & Invitations
        </h1>

        {/* theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}