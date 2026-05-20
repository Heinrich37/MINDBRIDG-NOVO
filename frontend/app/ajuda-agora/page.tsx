import Link from "next/link";
import { LifeBuoy, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HelpNowPage() {
  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl"><Logo /></div>
      <section className="glass mx-auto mt-8 max-w-3xl rounded-[2rem] p-6 md:p-8">
        <LifeBuoy className="text-red-600" size={34} />
        <h1 className="mt-5 text-3xl font-semibold">Preciso de ajuda agora</h1>
        <p className="mt-4 leading-7 text-ink/70 dark:text-white/70">Se houver risco imediato, procure ajuda humana imediatamente. O MindBridge não substitui emergência médica ou atendimento especializado.</p>
        <div className="mt-6 grid gap-3">
          {["CVV 188", "SAMU 192", "Bombeiros 193"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 dark:bg-white/10">
              <Phone size={18} className="text-ocean" />
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
        <Link href="/entrada" className="mt-6 inline-flex rounded-2xl bg-ink px-5 py-3 font-medium text-white dark:bg-mint dark:text-ink">Voltar para conversar</Link>
      </section>
    </main>
  );
}
