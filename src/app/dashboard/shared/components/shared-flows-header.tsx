"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const cn = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    dark,
    // Azul cartoon para bordes y sombra
    shadow: dark
      ? "shadow-[6px_6px_0px_#1e40af]" // blue-800
      : "shadow-[6px_6px_0px_#334155]", // neutral-800
    barBg: dark
      ? "bg-[#19213a] border-b-blue-600"
      : "bg-white border-b-neutral-800",
    btnBorder: dark
      ? "border-blue-500"
      : "border-neutral-800",
    btnBg: dark
      ? "bg-[#253155] hover:bg-[#334155]"
      : "bg-white hover:bg-neutral-100",
    btnText: dark
      ? "text-blue-100"
      : "text-neutral-800",
    title: dark
      ? "text-blue-100"
      : "text-neutral-800",
    iconSun: "text-blue-300",
    iconMoon: "text-blue-600",
    iconBack: dark ? "text-blue-200" : "text-blue-700",
  };
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { dark, shadow, btnBorder, btnBg, btnText, iconSun, iconMoon } = useCartoon();
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "h-12 w-12 border-[4px] rounded-xl transition-all duration-200 font-extrabold group",
        shadow,
        btnBorder,
        btnBg,
        btnText,
        "focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
      )}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      tabIndex={0}
    >
      {dark ? (
        <Sun className={cn("h-7 w-7", iconSun, "drop-shadow")} />
      ) : (
        <Moon className={cn("h-7 w-7", iconMoon, "drop-shadow")} />
      )}
    </Button>
  );
}

export function CollaborationsTopBar() {
  const { dark, shadow, barBg, btnBorder, btnBg, btnText, title, iconBack } = useCartoon();

  return (
    <div
      className={cn(
        "sticky top-0 z-30 w-full border-b-[4px] px-2 sm:px-6 py-2 sm:py-3",
        barBg,
        shadow
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
        {/* Back button */}
        <Link href="/dashboard" tabIndex={-1}>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 border-[4px] rounded-xl transition-all duration-200 mr-2 font-extrabold group",
              btnBorder,
              btnBg,
              btnText,
              shadow,
              "focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            )}
            title="Volver al dashboard"
            tabIndex={0}
          >
            <ArrowLeft className={cn("h-7 w-7", iconBack)} />
          </Button>
        </Link>

        {/* Title */}
        <h1
          className={cn(
            "flex-1 text-center text-2xl sm:text-3xl font-extrabold tracking-wide select-none",
            "drop-shadow",
            title
          )}
        >
          Shared Flows & Invitations
        </h1>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
