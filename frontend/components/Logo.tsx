import { Waypoints } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-soft dark:bg-mint dark:text-ink">
        <Waypoints size={23} />
      </div>
      <div>
        <p className="text-xl font-semibold tracking-normal">MindBridge</p>
        <p className="text-xs text-ink/60 dark:text-white/60">Uma ponte para pedir ajuda.</p>
      </div>
    </div>
  );
}
