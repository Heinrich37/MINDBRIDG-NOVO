"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { AlertTriangle, CheckCircle2, Clock3, MessageCircle } from "lucide-react";
import { api, API_URL, Conversation, STATIC_DEMO } from "@/lib/api";
import { Logo } from "@/components/Logo";

const filters = [
  ["all", "Todas"],
  ["anonymous", "Anônimas"],
  ["identified", "Identificadas"],
  ["alert", "Em alerta"],
  ["waiting", "Aguardando resposta"],
  ["closed", "Encerradas"]
];

const riskLabel = { green: "Verde", yellow: "Amarelo", red: "Vermelho" };
const riskClass = { green: "bg-emerald-100 text-emerald-800", yellow: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800" };

export default function CounselorDashboardPage() {
  const [dashboard, setDashboard] = useState({ total: 0, alerts: 0, waiting: 0, closed: 0 });
  const [filter, setFilter] = useState("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [alertFlash, setAlertFlash] = useState(false);

  async function load(selected = filter) {
    const [dash, list] = await Promise.all([
      api<typeof dashboard>("/counselor/dashboard"),
      api<Conversation[]>(`/counselor/conversations?filter=${selected}`)
    ]);
    setDashboard(dash);
    setConversations(list);
  }

  useEffect(() => {
    load();
    if (STATIC_DEMO) return;
    const socket = io(API_URL.replace("/api", ""));
    socket.emit("join:counselor");
    socket.on("conversation:update", () => load());
    socket.on("alert:red", () => {
      setAlertFlash(true);
      new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQ4AAAAAAP//AAD//wAA//8AAP//AAA=").play().catch(() => null);
      setTimeout(() => setAlertFlash(false), 1800);
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  const cards = useMemo(() => [
    { label: "Total de conversas", value: dashboard.total, icon: MessageCircle },
    { label: "Conversas em alerta", value: dashboard.alerts, icon: AlertTriangle },
    { label: "Aguardando resposta", value: dashboard.waiting, icon: Clock3 },
    { label: "Atendimentos encerrados", value: dashboard.closed, icon: CheckCircle2 }
  ], [dashboard]);

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between"><Logo /><Link href="/" className="text-sm text-ink/65 dark:text-white/65">Sair</Link></div>
      <section className="mx-auto mt-8 max-w-6xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ocean">Dashboard</p>
            <h1 className="text-3xl font-semibold">Acompanhamento da orientadora</h1>
          </div>
          {alertFlash && <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white">Novo alerta vermelho</span>}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {cards.map((card) => <div key={card.label} className="glass rounded-3xl p-5"><card.icon className="text-ocean" size={22} /><p className="mt-4 text-3xl font-semibold">{card.value}</p><p className="mt-1 text-sm text-ink/62 dark:text-white/62">{card.label}</p></div>)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${filter === value ? "bg-ink text-white dark:bg-mint dark:text-ink" : "bg-white/70 text-ink/70 dark:bg-white/10 dark:text-white/70"}`}>{label}</button>)}
        </div>
        <div className="glass overflow-hidden rounded-[1.7rem]">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/orientadora/conversas/${conversation.id}`} className={`grid gap-3 border-b border-ink/8 p-4 transition hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/5 md:grid-cols-[1fr_auto_auto] ${conversation.risk_level === "red" ? "bg-red-50/70 dark:bg-red-950/25" : ""}`}>
              <div>
                <p className="font-medium">{conversation.user?.is_anonymous ? conversation.user.anonymous_code : conversation.user?.name}</p>
                <p className="mt-1 text-sm text-ink/58 dark:text-white/58">{conversation.messages.at(-1)?.message || "Sem mensagens"}</p>
              </div>
              <span className={`h-fit rounded-full px-3 py-1 text-xs font-medium ${riskClass[conversation.risk_level]}`}>{riskLabel[conversation.risk_level]}</span>
              <span className="text-sm text-ink/55 dark:text-white/55">{new Date(conversation.updated_at).toLocaleString("pt-BR")}</span>
            </Link>
          ))}
          {conversations.length === 0 && <p className="p-6 text-center text-ink/60 dark:text-white/60">Nenhuma conversa neste filtro.</p>}
        </div>
      </section>
    </main>
  );
}
