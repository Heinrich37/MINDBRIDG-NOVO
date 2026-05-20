"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, HeartHandshake, LifeBuoy } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>

      <section className="mx-auto grid max-w-6xl items-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/60 bg-white/70 px-4 py-2 text-sm text-ink/70 dark:border-white/10 dark:bg-white/10 dark:text-white/75">
            <HeartHandshake size={16} />
            Acolhimento inicial para alunos do Senac
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink dark:text-white md:text-6xl">Um espaço seguro para conversar e buscar orientação.</h1>
            <p className="max-w-xl text-lg leading-8 text-ink/70 dark:text-white/72">Você não precisa passar por tudo sozinho.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/entrada" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 font-medium text-white shadow-soft transition hover:-translate-y-0.5 dark:bg-mint dark:text-ink">
              Começar agora <ArrowRight size={18} />
            </Link>
            <Link href="/ajuda-agora" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white/70 px-6 py-4 font-medium text-red-700 transition hover:border-red-300 dark:border-red-300/30 dark:bg-white/10 dark:text-red-200">
              <LifeBuoy size={18} /> Preciso de ajuda agora
            </Link>
          </div>
          <SafetyNotice />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.08 }} className="glass rounded-[2rem] p-6">
          <div className="rounded-[1.5rem] bg-white p-5 dark:bg-white">
            <QRCodeSVG value={`${appUrl}/entrada`} size={240} className="h-full w-full" fgColor="#17324D" />
          </div>
          <div className="mt-5 space-y-2">
            <p className="font-semibold">Acesse pelo QR Code</p>
            <p className="text-sm leading-6 text-ink/65 dark:text-white/65">Ideal para cartazes, murais e materiais internos. O aluno escolhe entrar identificado ou anonimamente.</p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
