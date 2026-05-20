"use client";

import { X } from "lucide-react";

export function BreathingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-5 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-[2rem] p-6 text-center">
        <button onClick={onClose} className="ml-auto flex rounded-full p-2 hover:bg-white/50 dark:hover:bg-white/10" title="Fechar">
          <X size={18} />
        </button>
        <div className="mx-auto my-8 flex h-44 w-44 items-center justify-center rounded-full bg-mint/40">
          <div className="breathing h-28 w-28 rounded-full bg-ocean/70 shadow-soft" />
        </div>
        <h2 className="text-2xl font-semibold">Respiração guiada</h2>
        <div className="mt-4 space-y-2 text-ink/70 dark:text-white/70">
          <p>Inspire por 4 segundos</p>
          <p>Segure por 4 segundos</p>
          <p>Expire por 4 segundos</p>
        </div>
      </div>
    </div>
  );
}
