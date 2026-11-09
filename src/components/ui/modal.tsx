import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, PenLine, Eye, Upload, Info } from "lucide-react";
import { cn } from "../../lib/utils";

type ModalVariant = "create" | "edit" | "detail" | "import" | "info";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Ligne secondaire sous le titre (ex. code, identifiant) */
  subtitle?: React.ReactNode;
  /** Type de modal : fixe l'icône et la teinte de l'en-tête */
  variant?: ModalVariant;
  /** Remplace l'icône par défaut du variant */
  icon?: React.ReactNode;
  /** Boutons d'action affichés dans une barre fixe en bas */
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

// Teinte principale + dégradé de la tuile d'icône + fond doux de l'en-tête
const VARIANTS: Record<ModalVariant, { tint: string; deep: string; soft: string; Icon: typeof Plus }> = {
  create: { tint: "#0d9488", deep: "#0f766e", soft: "#f0fdfa", Icon: Plus },
  edit:   { tint: "#ea580c", deep: "#c2410c", soft: "#fff7ed", Icon: PenLine },
  detail: { tint: "#0284c7", deep: "#0369a1", soft: "#f0f9ff", Icon: Eye },
  import: { tint: "#7c3aed", deep: "#6d28d9", soft: "#f5f3ff", Icon: Upload },
  info:   { tint: "#0d9488", deep: "#0f766e", soft: "#f0fdfa", Icon: Info },
};

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

/** Motif décoratif de l'en-tête : anneaux concentriques et points, très discrets. */
function HeaderPattern({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-6 -top-10 h-40 w-56 dark:opacity-40"
      viewBox="0 0 220 160"
      fill="none"
    >
      {[34, 54, 74, 94].map((r, i) => (
        <circle key={r} cx="170" cy="40" r={r} stroke={color} strokeOpacity={0.14 - i * 0.025} strokeWidth="1.5" />
      ))}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 6 }).map((__, col) => (
          <circle key={`${row}-${col}`} cx={40 + col * 14} cy={30 + row * 14} r="1.4" fill={color} fillOpacity={0.12} />
        ))
      )}
    </svg>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = "info",
  icon,
  footer,
  children,
  size = "md",
}: ModalProps) {
  // Échap pour fermer + page figée derrière la modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const v = VARIANTS[variant] ?? VARIANTS.info;
  const hasHeader = title != null && title !== "";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Voile */}
      <motion.div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-[4px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
        className={cn(
          "popup-modal relative flex w-full max-h-[90vh] flex-col overflow-hidden",
          "rounded-[24px] bg-slate-50 text-card-foreground dark:bg-card",
          "ring-1 ring-slate-900/[0.07] dark:ring-white/10",
          "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-8px_rgba(15,23,42,0.12),0_40px_80px_-20px_rgba(15,23,42,0.25)]",
          SIZES[size]
        )}
        style={{ ["--mdl-tint" as string]: v.tint, ["--mdl-soft" as string]: v.soft }}
      >
        {/* Liseré de couleur en haut */}
        <div aria-hidden className="h-[3px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${v.tint}, ${v.deep}, transparent)` }} />

        {hasHeader ? (
          <div
            className="relative flex shrink-0 items-center gap-4 overflow-hidden border-b border-slate-200/70 bg-white px-6 py-4 dark:border-white/10 dark:bg-card"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 dark:opacity-25"
              style={{ background: `radial-gradient(120% 140% at 0% 0%, ${v.soft}, transparent 65%)` }}
            />
            <HeaderPattern color={v.tint} />

            {/* Tuile d'icône en dégradé */}
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-white [&_svg]:h-5 [&_svg]:w-5"
              style={{
                background: `linear-gradient(135deg, ${v.tint}, ${v.deep})`,
                boxShadow: `0 8px 18px -6px ${v.tint}99, inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
            >
              {icon ?? <v.Icon strokeWidth={2.2} />}
            </div>

            <div className="relative min-w-0 flex-1">
              <h2 className="m-0 truncate text-[16.5px] font-semibold leading-snug tracking-[-0.015em] text-slate-900 dark:text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="m-0 mt-0.5 truncate text-[12.5px] font-medium text-slate-500 dark:text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="relative">
              <CloseButton onClose={onClose} />
            </div>
          </div>
        ) : (
          <div className="absolute right-3.5 top-4 z-10">
            <CloseButton onClose={onClose} />
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="relative flex shrink-0 items-center justify-end gap-2 border-t border-slate-200/70 bg-white px-6 py-3.5 dark:border-white/10 dark:bg-card">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[11px] border border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:border-slate-300 hover:text-slate-700 hover:rotate-90 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/10 dark:hover:text-foreground"
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
