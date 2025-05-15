/* ----------- Flow Library – cartoon-style, refined sticky top-bar ------------- */
/*  – top-bar spans full width, flat top-edge (no radius collision)              */
/*  – compact on phones, spacious on ≥640 px                                     */
/*  – keeps thick "hand-drawn" shadow & borders                                  */

"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PublicFlowListItem } from "@/services/storage/public-flow-share";
import {
  Search,
  Eye,
  Calendar,
  ArrowRight,
  User as UserIcon,
  Sparkles,
  Grid3X3,
  ChevronLeft,
  Sun,
  Moon
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* -------------------------------------------------------------------------- */
/*                                   palette                                  */
/* -------------------------------------------------------------------------- */
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const shadow = dark
    ? "shadow-[4px_4px_0px_#172554]"
    : "shadow-[4px_4px_0px_#0f172a]";

  return {
    dark,
    shadow,
    page: cn(
      "flex flex-col h-screen font-semibold tracking-tight",
      dark ? "bg-[#0f172a] text-blue-100" : "bg-[#fefafa] text-slate-800"
    ),
    topbar: cn(
      "sticky top-0 z-20 w-full",
      "backdrop-blur-md border-b-[3px] border-x-0 border-t-0", // flat top edge
      shadow,
      dark ? "bg-[#0f172acc]/70 border-blue-600" : "bg-white/80 border-slate-900"
    ),
    inner: "w-full flex flex-col sm:flex-row gap-4 items-center px-6 py-4",
    card: cn(
      "relative group rounded-2xl border-[3px] px-4 py-3 flex flex-col min-h-36",
      shadow,
      dark
        ? "bg-[#1e293b] border-blue-600 group-hover:border-blue-400"
        : "bg-white border-slate-900 group-hover:border-blue-600"
    ),
    iconWrap: cn(
      "inline-flex items-center justify-center rounded-md p-1.5 border-[3px]",
      shadow,
      dark ? "bg-blue-900 border-blue-600" : "bg-blue-200 border-blue-600"
    ),
    scroll:
      "scrollbar-thin scrollbar-thumb-blue-400/60 scrollbar-track-transparent",
    actionButton: cn(
      "h-9 w-9 flex items-center justify-center rounded-md border-[3px]",
      shadow,
      dark 
        ? "bg-blue-900 border-blue-600 hover:bg-blue-800" 
        : "bg-blue-100 border-blue-600 hover:bg-blue-200"
    ),
  };
};

/* Theme Toggle Component */
const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const P = useCartoon();
  
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex items-center justify-center rounded-md border-[3px] h-10 w-10",
        P.shadow,
        P.dark 
          ? "bg-blue-900/80 border-blue-600 hover:bg-blue-800 text-yellow-300" 
          : "bg-blue-100/80 border-blue-600 hover:bg-blue-200 text-blue-600"
      )}
      aria-label="Toggle theme"
      title={P.dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {P.dark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

/* Dashboard Return Button */
const DashboardButton = () => {
  const P = useCartoon();
  
  return (
    <Link 
      href="/dashboard" 
      className={cn(
        "flex items-center justify-center gap-2 px-3 rounded-md border-[3px] h-10",
        P.shadow,
        P.dark 
          ? "bg-blue-900/80 border-blue-600 hover:bg-blue-800 text-blue-300" 
          : "bg-blue-100/80 border-blue-600 hover:bg-blue-200 text-blue-600"
      )}
      title="Return to Dashboard"
    >
      <ChevronLeft className="h-5 w-5" />
      <span className="text-sm font-medium">Dashboard</span>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   utils                                    */
/* -------------------------------------------------------------------------- */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* -------------------------------------------------------------------------- */
/*                                   card                                     */
/* -------------------------------------------------------------------------- */
const FlowCard = ({ f }: { f: PublicFlowListItem }) => {
  const P = useCartoon();
  const [accessCount, setAccessCount] = useState(f.access_count);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Función para actualizar el contador de accesos
  const refreshAccessCount = async () => {
    try {
      setIsRefreshing(true);
      
      // Primer intento: endpoint de estadísticas estándar
      const response = await fetch(`/api/public-flow/${f.share_id}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.access_count === 'number') {
          setAccessCount(data.access_count);

          return; // Éxito en el primer intento
        }
      } else {

      }
      
      // Si fallamos con el método estándar, intentar con el método directo

      const directResponse = await fetch(`/api/public-flow/${f.share_id}/direct-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (directData && typeof directData.access_count === 'number') {
          setAccessCount(directData.access_count);

        } else {

        }
      } else {

      }
    } catch (error) {

    } finally {
      // Ensure the refresh indicator is visible for a minimum time
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Set up auto-refresh on mount and clean up on unmount
  useEffect(() => {
    // Function to start auto-refresh
    const startAutoRefresh = () => {
      // Clear any existing interval
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      
      // Set up new interval (refresh every 60 seconds)
      autoRefreshRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshAccessCount();
        }
      }, 60000); // 60 seconds
    };

    // Initial refresh after mounting (with a small delay)
    const initialRefreshTimeout = setTimeout(() => {
      if (!isInitialMount.current) return;
      isInitialMount.current = false;
      refreshAccessCount();
    }, 3000);
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Set up visibility change listener to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when becoming visible
        refreshAccessCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up on unmount
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(initialRefreshTimeout);
    };
  }, [f.share_id]); // Dependency on share_id ensures refresh on card change
  
  return (
    <div
      className={cn(
        P.card,
        "transition-transform duration-150 hover:-translate-y-1 hover:rotate-[0.3deg]"
      )}
    >
      <div className="flex items-start gap-3">
        <span className={P.iconWrap}>
          <Sparkles className="h-4 w-4 text-blue-400" />
        </span>
        <div className="flex-1">
          <h3 className="text-base truncate">{f.flow_name || "Untitled"}</h3>
          <p className="text-xs opacity-70 truncate">
            {f.flow_description || "No description"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {fmtDate(f.shared_at)}
        </span>
        <span className="flex items-center gap-1 group relative">
          <Eye className="h-3 w-3" />
          <span className="flex items-center">
            {isRefreshing ? (
              <span className="animate-pulse">...</span>
            ) : (
              accessCount
            )}
          </span>
        </span>
      </div>

      <div className="mt-auto pt-2 flex items-center gap-2 border-t-[3px] border-dashed border-current">
        {f.avatar_url ? (
          <Image
            src={f.avatar_url}
            alt="avatar"
            width={20}
            height={20}
            className="rounded-full object-cover border-[3px] border-current"
          />
        ) : (
          <UserIcon className="h-4 w-4" />
        )}
        <span className="text-xs truncate flex-1">
          {f.author_display_name || "Unknown"}
        </span>
        <Button
          asChild
          size="sm"
          className={cn(
            "h-7 px-3 gap-1 border-[3px]",
            P.shadow,
            "bg-blue-600 hover:bg-blue-500 text-white"
          )}
        >
          <Link href={`/share/${f.share_id}`}>
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 empty msg                                  */
/* -------------------------------------------------------------------------- */
const Empty = () => {
  const P = useCartoon();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <Sparkles className="h-10 w-10 text-blue-400 animate-bounce" />
      <p className="text-lg">No flows yet – share something cool!</p>
      <Button asChild className="border-[3px]">
        <Link href="/dashboard">Create flow</Link>
      </Button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              main component                                */
/* -------------------------------------------------------------------------- */
export function LibraryInterface({ flows }: { flows: PublicFlowListItem[] }) {
  const P = useCartoon();

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "popular" | "recent">("all");

  const list = useMemo(() => {
    let arr = [...flows];
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (f) =>
          f.flow_name?.toLowerCase().includes(s) ||
          f.flow_description?.toLowerCase().includes(s) ||
          f.author_display_name?.toLowerCase().includes(s)
      );
    }
    if (tab === "popular") arr.sort((a, b) => b.access_count - a.access_count);
    if (tab === "recent")
      arr.sort(
        (a, b) => +new Date(b.shared_at) - +new Date(a.shared_at)
      );
    return arr;
  }, [flows, q, tab]);

  return (
    <div className={P.page}>
      {/* sticky cartoon top-bar */}
      <div className={P.topbar}>
        <div className={P.inner}>
          {/* Left section: Back button and title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <DashboardButton />
            <h1 className="text-2xl font-bold">Flow Library</h1>
          </div>

          {/* Center section: search and tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full max-w-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search flows..."
                className="pl-9 h-10 border-[3px]"
              />
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-shrink-0 w-full sm:w-auto">
              <TabsList className="border-[3px] w-full sm:w-auto">
                <TabsTrigger value="all" className="px-4 py-2">
                  <Grid3X3 className="h-4 w-4 mr-1.5" /> All
                </TabsTrigger>
                <TabsTrigger value="popular" className="px-4 py-2">
                  <Eye className="h-4 w-4 mr-1.5" /> Popular
                </TabsTrigger>
                <TabsTrigger value="recent" className="px-4 py-2">
                  <Calendar className="h-4 w-4 mr-1.5" /> Recent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Right section: user controls */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            <ThemeToggle />
            <div className={cn(
              "border-[3px] rounded-md overflow-hidden", 
              "h-10 w-10 flex items-center justify-center",
              P.shadow
            )}>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-full w-full",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <main className={cn("flex-1 overflow-y-auto px-6 py-6", P.scroll)}>
        <div className="max-w-7xl mx-auto w-full">
          {list.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((f) => (
                <FlowCard key={f.share_id} f={f} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
