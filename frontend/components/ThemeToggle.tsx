"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mindbridge_theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("mindbridge_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button onClick={toggle} className="rounded-full border border-ink/10 bg-white/70 p-3 text-ink shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white" title="Alternar tema">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
