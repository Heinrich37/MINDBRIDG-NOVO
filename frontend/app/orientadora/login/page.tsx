"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function CounselorLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<{ token: string }>("/counselor/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      localStorage.setItem("mindbridge_token", data.token);
      router.push("/orientadora/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-md"><Logo /></div>
      <form onSubmit={submit} className="glass mx-auto mt-10 max-w-md space-y-5 rounded-[2rem] p-6">
        <LockKeyhole className="text-ocean" />
        <div>
          <h1 className="text-3xl font-semibold">Painel da orientadora</h1>
          <p className="mt-2 text-sm text-ink/65 dark:text-white/65">Acesso restrito para acompanhamento interno.</p>
        </div>
        <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
        <input name="password" type="password" required placeholder="Senha" className="w-full rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none focus:border-ocean dark:border-white/10 dark:bg-white/10" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-ink px-5 py-4 font-medium text-white shadow-soft disabled:opacity-60 dark:bg-mint dark:text-ink">{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}
