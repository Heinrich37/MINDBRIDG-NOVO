import { ShieldAlert } from "lucide-react";

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-ocean/20 bg-white/70 p-4 text-sm text-ink/70 dark:border-white/10 dark:bg-white/10 dark:text-white/75">
      <ShieldAlert className="mt-0.5 shrink-0 text-ocean" size={18} />
      <p>
        O MindBridge não substitui atendimento psicológico, psiquiátrico, médico ou emergencial{compact ? "." : " e não realiza diagnósticos. Em risco imediato, procure CVV 188, SAMU 192 ou Bombeiros 193."}
      </p>
    </div>
  );
}
