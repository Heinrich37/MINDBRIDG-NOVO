"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Checkin } from "@/components/Checkin";
import { Logo } from "@/components/Logo";
import { SafetyNotice } from "@/components/SafetyNotice";

export default function IdentifiedEntryPage() {
  const router = useRouter();
  const [checkin, setCheckin] = useState("Neutro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<{ conversation: { id: string } }>("/entry/identified", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          course: form.get("course"),
          consent: form.get("consent") === "on",
          checkin
        })
      });
      router.push(`/chat/${data.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl"><Logo /></div>
      <form onSubmit={submit} className="glass mx-auto mt-8 max-w-3xl space-y-5 rounded-[2rem] p-6 md:p-8">
        <div>
          <p className="text-sm font-medium text-ocean">Entrada identificada</p>
          <h1 className="mt-2 text-3xl font-semibold">Antes de conversar</h1>
        </div>
        <Checkin value={checkin} onChange={setCheckin} />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="name" required placeholder="Nome" className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
          <input name="phone" required placeholder="Telefone" className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
          <input name="email" required type="email" placeholder="E-mail" className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
          <input name="course" placeholder="Curso/Turma (opcional)" className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
        </div>
        <label className="flex gap-3 rounded-2xl bg-white/60 p-4 text-sm leading-6 text-ink/75 dark:bg-white/10 dark:text-white/75">
          <input name="consent" required type="checkbox" className="mt-1 h-4 w-4" />
          Entendo que esta conversa pode ser encaminhada para a orientadora do Senac caso seja necessário acompanhamento.
        </label>
        <SafetyNotice compact />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-ink px-5 py-4 font-medium text-white shadow-soft disabled:opacity-60 dark:bg-mint dark:text-ink">
          {loading ? "Entrando..." : "Entrar e continuar"}
        </button>
      </form>
    </main>
  );
}
