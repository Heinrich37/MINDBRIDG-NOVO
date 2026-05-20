"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EyeOff, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EntryPage() {
  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-ocean">Entrada</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal md:text-5xl">Como você prefere conversar?</h1>
          <p className="mt-4 text-ink/68 dark:text-white/68">Você pode se identificar para facilitar o acompanhamento ou conversar sem informar dados pessoais.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { href: "/entrada/identificado", icon: UserRound, title: "Entrar identificado", text: "Informe seus dados para a orientadora conseguir reconhecer e acompanhar melhor." },
            { href: "/entrada/anonimo", icon: EyeOff, title: "Entrar anonimamente", text: "Converse sem informar sua identidade. Situações de risco ainda podem gerar alerta interno." }
          ].map((item, index) => (
            <motion.div key={item.href} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Link href={item.href} className="glass block h-full rounded-[1.6rem] p-6 transition hover:-translate-y-1">
                <item.icon className="mb-8 text-ocean" size={32} />
                <h2 className="text-2xl font-semibold">{item.title}</h2>
                <p className="mt-3 leading-7 text-ink/65 dark:text-white/65">{item.text}</p>
              </Link>
            </motion.div>
          ))}
        </div>
        <SafetyNotice />
      </section>
    </main>
  );
}
