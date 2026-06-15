"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, STATIC_DEMO } from "@/lib/api";
import { Checkin } from "@/components/Checkin";
import { Logo } from "@/components/Logo";
import { SafetyNotice } from "@/components/SafetyNotice";

export default function AnonymousEntryPage() {
  const router = useRouter();
  const [checkin, setCheckin] = useState("Neutro");
  const [loading, setLoading] = useState(false);
  const [anonymousCode, setAnonymousCode] = useState("");
  const [error, setError] = useState("");

  async function enter() {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ user: { anonymous_code: string }; conversation: { id: string }; conversation_token: string }>("/entry/anonymous", {
        method: "POST",
        body: JSON.stringify({ checkin })
      });
      localStorage.setItem("mindbridge_conversation_id", data.conversation.id);
      localStorage.setItem(`mindbridge_conversation_token:${data.conversation.id}`, data.conversation_token);
      setAnonymousCode(data.user.anonymous_code);
      setTimeout(() => router.push(STATIC_DEMO ? "/chat/demo" : `/chat/${data.conversation.id}`), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar anonimamente");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-2xl"><Logo /></div>
      <section className="glass mx-auto mt-8 max-w-2xl space-y-6 rounded-[2rem] p-6 md:p-8">
        <div>
          <p className="text-sm font-medium text-ocean">Entrada anônima</p>
          <h1 className="mt-2 text-3xl font-semibold">Você poderá conversar sem informar sua identidade.</h1>
          <p className="mt-4 leading-7 text-ink/68 dark:text-white/68">Um código anônimo único será gerado automaticamente, como MB-2026-0001.</p>
        </div>
        <Checkin value={checkin} onChange={setCheckin} />
        <SafetyNotice />
        <p className="rounded-2xl bg-white/60 p-4 text-sm leading-6 text-ink/70 dark:bg-white/10 dark:text-white/70">Mesmo anônimo, situações de risco podem gerar alertas internos para acompanhamento.</p>
        {anonymousCode && <p className="rounded-2xl border border-mint bg-mint/30 p-4 text-center font-semibold text-ink">Código gerado: {anonymousCode}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={enter} disabled={loading} className="w-full rounded-2xl bg-ink px-5 py-4 font-medium text-white shadow-soft disabled:opacity-60 dark:bg-mint dark:text-ink">
          {loading ? anonymousCode ? "Entrando na conversa..." : "Gerando código..." : "Entrar anonimamente"}
        </button>
      </section>
    </main>
  );
}
