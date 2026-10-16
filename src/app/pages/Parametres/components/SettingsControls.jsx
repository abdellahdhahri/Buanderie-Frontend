import React from "react";

/* Petites commandes partagées par les onglets de réglages */

/** Choix exclusif sous forme de pastilles (ex. 10 / 20 / 50). */
export function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap gap-1 rounded-[12px] bg-slate-100 p-1 dark:bg-white/5">
      {options.map((o) => {
        const selected = String(value) === String(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
              selected
                ? "bg-white text-teal-700 shadow-[0_1px_2px_rgba(15,23,42,0.08),0_4px_10px_-4px_rgba(15,23,42,0.15)] dark:bg-card dark:text-teal-300"
                : "text-slate-500 hover:text-slate-800 dark:text-muted-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Curseur avec la valeur affichée à droite. */
export function Slider({ value, min, max, step = 1, onChange, format = (v) => v, ariaLabel }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-40 cursor-pointer accent-teal-600"
      />
      <span className="min-w-[56px] rounded-md bg-slate-100 px-2 py-0.5 text-center text-[12.5px] font-semibold tabular-nums text-slate-700 dark:bg-white/5 dark:text-foreground">
        {format(value)}
      </span>
    </div>
  );
}

/** Bouton secondaire discret (réinitialiser, tester…). */
export function GhostButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-white/5"
    >
      {children}
    </button>
  );
}
