import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Briques d'interface de la page Paramètres
   ═══════════════════════════════════════════════════════════════════════════ */

// Carte de section : titre, description, contenu, pied optionnel
export function SettingsCard({ icon, title, description, children, footer }) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:border-border dark:bg-card">
      <header className="flex items-start gap-3.5 border-b border-slate-100 px-6 py-5 dark:border-border">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-4 ring-teal-500/10 dark:bg-teal-500/10 dark:text-teal-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="m-0 text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-foreground">
            {title}
          </h2>
          {description && (
            <p className="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <footer className="flex items-center justify-end gap-2.5 rounded-b-[20px] border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 dark:border-border dark:bg-transparent">
          {footer}
        </footer>
      )}
    </section>
  );
}

// Ligne de réglage : libellé + aide à gauche, contrôle à droite
export function SettingRow({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0 [&+&]:border-t [&+&]:border-slate-100 dark:[&+&]:border-border">
      <div className="min-w-0">
        <p className="m-0 text-[13.5px] font-medium text-slate-800 dark:text-foreground">{label}</p>
        {hint && <p className="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Interrupteur accessible (role="switch")
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-500/25 ${
        checked ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-[#fff] shadow-[0_1px_3px_rgba(15,23,42,0.25)] transition-transform duration-200 ${
          checked ? "translate-x-[23px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// Champ mot de passe avec bouton afficher / masquer
export function PasswordField({ label, value, onChange, autoComplete, placeholder, invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">{label}</span>
      <span className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`h-10 w-full rounded-[10px] border bg-white pl-3.5 pr-11 text-[13.5px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-[3px] dark:bg-card dark:text-foreground ${
            invalid
              ? "border-red-300 focus:border-red-400 focus:ring-red-500/12"
              : "border-slate-200 focus:border-teal-500/70 focus:ring-teal-500/12 dark:border-border"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer" : "Afficher"}
          className="absolute right-1.5 top-1/2 flex h-7 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

// Carte de choix (thème, langue…) avec état sélectionné
export function ChoiceCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex cursor-pointer flex-col items-stretch gap-2.5 rounded-2xl border bg-white p-2.5 text-left transition-all duration-150 dark:bg-card ${
        selected
          ? "border-teal-500 ring-[3px] ring-teal-500/15"
          : "border-slate-200 hover:border-slate-300 hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.12)] dark:border-border"
      }`}
    >
      {children}
    </button>
  );
}
