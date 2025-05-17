"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  Check,
  X,
  Users,
  Inbox,
  Clock,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { createActionClient } from "@/store/utils/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { CollaborationsTopBar } from "./components/shared-flows-header";
import { cn } from "@/lib/utils";

// --- cartoon UI style helper ---
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    dark,
    shadow: dark
      ? "shadow-[5px_5px_0px_#1e40af]"
      : "shadow-[5px_5px_0px_#334155]",
    page: dark
      ? "bg-[#16213a] text-blue-100"
      : "bg-white text-neutral-900",
    card: cn(
      "rounded-2xl border-[3px] px-6 py-5 flex flex-col min-h-40 transition-all duration-200 group",
      "hover:scale-[1.03] active:scale-[0.99]",
      dark
        ? "bg-[#23315d] border-blue-400"
        : "bg-white border-neutral-800",
      "hover:border-blue-500", // efecto cartoon
      "hover:shadow-[7px_7px_0px_#1e40af]"
    ),
    btn: cn(
      "border-[3px] rounded-xl font-extrabold transition-all duration-150 px-5 py-2",
      "shadow-sm",
      dark
        ? "border-blue-400 bg-[#19213a] text-blue-100 hover:bg-[#253155] hover:text-white"
        : "border-neutral-800 bg-white text-blue-900 hover:bg-neutral-100 hover:text-blue-900"
    ),
    btnPrimary: cn(
      "border-[3px] rounded-xl font-extrabold transition-all duration-150 px-5 py-2",
      "shadow",
      "bg-blue-600 border-blue-900 text-white hover:bg-blue-700 hover:border-blue-800"
    ),
    btnDanger: cn(
      "border-[3px] rounded-xl font-extrabold transition-all duration-150 px-5 py-2",
      dark
        ? "border-blue-400 bg-[#23315d] text-red-200 hover:bg-blue-800/70 hover:text-red-400"
        : "border-neutral-800 bg-white text-red-700 hover:bg-blue-50 hover:text-red-800"
    ),
    scroll: "scrollbar-thin scrollbar-thumb-blue-300/80",
    pill: cn(
      "rounded-full font-black text-xs px-4 py-1 border-2",
      dark
        ? "bg-[#0d182b] border-blue-700 text-blue-100"
        : "bg-blue-50 border-blue-400 text-blue-700"
    ),
    input: cn(
      "pl-10 h-12 border-[3px] rounded-xl text-base font-bold",
      dark
        ? "bg-[#19213a] border-blue-600 text-blue-100 placeholder:text-blue-200/70"
        : "bg-white border-neutral-800 text-blue-900 placeholder:text-blue-400"
    ),
    pending: dark
      ? "bg-blue-900/40 text-blue-200 border-blue-300"
      : "bg-blue-100 text-blue-900 border-blue-400",
    accepted: dark
      ? "bg-blue-800/40 text-blue-100 border-blue-400"
      : "bg-blue-50 text-blue-700 border-blue-400",
    badgeEdit: dark
      ? "bg-blue-800/40 text-blue-100 border-blue-300"
      : "bg-blue-50 text-blue-700 border-blue-400",
    badgeView: dark
      ? "bg-white border-blue-400 text-blue-500"
      : "bg-white border-blue-400 text-blue-500",
  };
};

type Collaboration = {
  collaboration_id: string;
  flow_id: string;
  flow_name: string;
  permission_level: "view" | "edit";
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  invited_by_name: string | null;
  invited_by_avatar: string | null;
  flow_slug?: string;
};

export default function CollaborationsDashboard() {
  const P = useCartoon();
  const { user } = useUser();
  const { toast } = useToast();
  const supabase = useMemo(() => createActionClient(), []);
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "accepted">("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const { theme } = useTheme();
  const dark = theme === "dark";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "get_user_collaborations_with_details"
      );
      if (error) throw error;
      setCollabs(data || []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, supabase, toast]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (
    id: string,
    status: "accepted" | "declined"
  ) => {
    setUpdating(id);
    try {
      const { error } = await supabase.rpc("update_flow_collaboration_status", {
        collaboration_id_param: id,
        new_status_param: status,
      });
      if (error) throw error;
      setCollabs((prev) =>
        prev.map((c) =>
          c.collaboration_id === id ? { ...c, status } : c
        )
      );
      toast({ title: `Invitación ${status}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = collabs.filter((c) =>
    search ? c.flow_name.toLowerCase().includes(search.toLowerCase()) : true
  );
  const pending = filtered.filter((c) => c.status === "pending");
  const accepted = filtered.filter((c) => c.status === "accepted");
  const list = tab === "pending" ? pending : accepted;

  const CardItem = (c: Collaboration) => {
    const t = new Date(c.invited_at);
    const waiting = updating === c.collaboration_id;
    const openFlowUrl = c.flow_slug ? `/flow/s/${c.flow_slug}` : `/flow/${c.flow_id}`;
    return (
      <Card key={c.collaboration_id} className={P.card}>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="truncate text-lg font-extrabold flex items-center gap-2">
            {tab === "pending" && (
              <Inbox className="h-5 w-5 text-blue-400 animate-bounce" />
            )}
            {tab === "accepted" && (
              <Users className="h-5 w-5 text-blue-600" />
            )}
            <span className="ml-1">{c.flow_name}</span>
          </CardTitle>
          {c.invited_by_name && (
            <CardDescription className="flex gap-2 items-center text-xs mt-1.5">
              <Avatar className="h-7 w-7 border-2 border-blue-200 shadow">
                <AvatarImage src={c.invited_by_avatar || undefined} />
                <AvatarFallback>{c.invited_by_name[0]}</AvatarFallback>
              </Avatar>
              Invitado por <span className="font-bold">{c.invited_by_name}</span>
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-3 pt-1 pb-0 flex justify-between items-center text-sm">
          <Badge
            className={cn(
              P.pill,
              c.permission_level === "edit" ? P.badgeEdit : P.badgeView
            )}
          >
            {c.permission_level === "edit" ? "Puede editar" : "Sólo lectura"}
          </Badge>
          <span className="flex items-center gap-1 opacity-70 font-extrabold">
            <Clock className="h-4 w-4" />
            {formatDistanceToNow(t, { addSuffix: true, locale: es })}
          </span>
        </CardContent>

        <CardFooter className="p-3 pt-2 flex justify-end gap-2">
          {c.status === "pending" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className={P.btnDanger}
                onClick={() => updateStatus(c.collaboration_id, "declined")}
                disabled={waiting}
              >
                {waiting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Rechazar
              </Button>
              <Button
                size="sm"
                className={P.btnPrimary}
                onClick={() => updateStatus(c.collaboration_id, "accepted")}
                disabled={waiting}
              >
                {waiting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Aceptar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              asChild
              className={P.btnPrimary}
            >
              <Link href={openFlowUrl}>Abrir Flujo</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#16213a]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );

  return (
    <div className={cn("h-screen flex flex-col", P.page)}>
      {/* Cartoon sticky top-bar */}
      <CollaborationsTopBar />

      <main className={cn("flex-1 overflow-y-auto px-4 py-8", P.scroll)}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-7 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-xs w-full">
              <Input
                placeholder="Buscar flujo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={P.input + " pr-3"}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 opacity-80 pointer-events-none" />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className={cn("border-[3px] rounded-xl px-2 py-1.5", P.shadow, dark ? "bg-[#23315d]" : "bg-white")}>
                <TabsTrigger value="pending" className="font-extrabold">
                  <Inbox className="h-4 w-4 mr-1 text-blue-400" /> Pendientes
                </TabsTrigger>
                <TabsTrigger value="accepted" className="font-extrabold">
                  <Users className="h-4 w-4 mr-1 text-blue-700" /> Aceptadas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {list.length === 0 ? (
            <p className="italic text-center opacity-70 text-base py-16">
              {tab === "pending"
                ? "No tienes invitaciones pendientes."
                : "Aún no colaboras en ningún flujo."}
            </p>
          ) : (
            <div className="grid gap-7 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {list.map(CardItem)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
