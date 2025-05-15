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

const cn = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const shadow = dark
    ? "shadow-[5px_5px_0px_#1e40af]"
    : "shadow-[5px_5px_0px_#334155]";
  return {
    dark,
    shadow,
    page: dark
      ? "bg-gradient-to-br from-[#111827] to-[#1e293b] text-blue-100"
      : "bg-gradient-to-br from-[#f0fdfa] to-[#e0e7ff] text-slate-800",
    card: cn(
      "rounded-3xl border-[3px] px-5 py-4 flex flex-col min-h-32 transition-all duration-150",
      shadow,
      dark
        ? "bg-[#1e293b] border-blue-500 hover:border-emerald-400/70"
        : "bg-white border-slate-900 hover:border-emerald-400/70"
    ),
    btnBorder: cn(
      "border-[3px] rounded-xl font-semibold transition-all duration-150",
      shadow
    ),
    scroll: "scrollbar-thin scrollbar-thumb-blue-400/80",
    pill: "px-3 py-1 rounded-full font-bold text-xs",
    input: cn(
      "pl-10 h-11 border-[3px] rounded-xl bg-opacity-70",
      shadow,
      dark ? "bg-[#334155] border-blue-600 text-blue-100" : "bg-white border-slate-900 text-slate-800"
    ),
    icon: (color: string) =>
      dark
        ? `text-${color}-200 drop-shadow-lg`
        : `text-${color}-600 drop-shadow`,
    pending: dark
      ? "bg-yellow-600/40 text-yellow-200 border-yellow-400"
      : "bg-yellow-100 text-yellow-900 border-yellow-400",
    accepted: dark
      ? "bg-green-800/40 text-green-200 border-green-500"
      : "bg-green-100 text-green-900 border-green-500",
    declined: dark
      ? "bg-red-800/40 text-red-200 border-red-500"
      : "bg-red-100 text-red-900 border-red-500",
    badgeEdit: dark
      ? "bg-emerald-600/40 text-emerald-200 border-emerald-400"
      : "bg-emerald-100 text-emerald-800 border-emerald-400",
    badgeView: dark
      ? "bg-blue-600/40 text-blue-100 border-blue-400"
      : "bg-blue-100 text-blue-800 border-blue-400",
  };
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

  useEffect(() => {
    load();
  }, [load]);

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
      <Card key={c.collaboration_id} className={P.card + " group"}>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="truncate text-lg font-black flex items-center gap-2">
            {tab === "pending" && <Inbox className="h-4 w-4 text-yellow-500 animate-bounce" />}
            {tab === "accepted" && <Users className="h-4 w-4 text-emerald-500" />}
            {c.flow_name}
          </CardTitle>
          {c.invited_by_name && (
            <CardDescription className="flex gap-2 items-center text-xs mt-1">
              <Avatar className="h-6 w-6 border-2 border-white/80">
                <AvatarImage src={c.invited_by_avatar || undefined} />
                <AvatarFallback>{c.invited_by_name[0]}</AvatarFallback>
              </Avatar>
              Invitado por <span className="font-bold">{c.invited_by_name}</span>
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-3 pt-2 pb-0 flex justify-between text-sm">
          <Badge
            className={cn(
              "rounded-full border-2 px-3 py-1 font-bold text-xs shadow",
              c.permission_level === "edit" ? P.badgeEdit : P.badgeView
            )}
          >
            {c.permission_level === "edit" ? "Puede editar" : "Sólo lectura"}
          </Badge>
          <span className="flex items-center gap-1 opacity-70 font-semibold">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(t, { addSuffix: true, locale: es })}
          </span>
        </CardContent>

        <CardFooter className="p-3 pt-2 flex justify-end gap-2">
          {c.status === "pending" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "hover:bg-red-200 hover:text-red-800 border-red-400 text-red-700 font-bold transition-all duration-150",
                  P.btnBorder
                )}
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
                className={cn(
                  "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 font-bold transition-all duration-150",
                  P.btnBorder
                )}
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
              className={cn(
                "bg-blue-500 hover:bg-blue-600 text-white border-blue-700 font-bold transition-all duration-150",
                P.btnBorder
              )}
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className={cn("h-screen flex flex-col", P.page)}>
      {/* Cartoon sticky top-bar */}
      <CollaborationsTopBar />

      <main className={cn("flex-1 overflow-y-auto px-4 py-7", P.scroll)}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Buscar flujo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={P.input}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 opacity-80 pointer-events-none" />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className={cn("border-[3px] rounded-xl px-1.5", P.shadow)}>
                <TabsTrigger value="pending">
                  <Inbox className="h-4 w-4 mr-1 text-yellow-500" /> Pendientes
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  <Users className="h-4 w-4 mr-1 text-emerald-500" /> Aceptadas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {list.length === 0 ? (
            <p className="italic text-center opacity-70">
              {tab === "pending"
                ? "No tienes invitaciones pendientes."
                : "Aún no colaboras en ningún flujo."}
            </p>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {list.map(CardItem)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
