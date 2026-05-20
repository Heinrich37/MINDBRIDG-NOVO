"use client";

const options = ["Muito bem", "Bem", "Neutro", "Mal", "Muito mal"];

export function Checkin({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-ink/80 dark:text-white/80">Como você está hoje?</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-2xl border px-3 py-3 text-sm transition ${value === option ? "border-ocean bg-ocean text-white" : "border-ink/10 bg-white/65 text-ink/70 hover:border-ocean/50 dark:border-white/10 dark:bg-white/10 dark:text-white/75"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
