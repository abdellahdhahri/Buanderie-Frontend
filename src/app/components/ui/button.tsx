import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    // Teal profond, léger reflet interne, ombre fine
    primary:
      "bg-teal-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(15,118,110,0.35),0_4px_12px_-4px_rgba(15,118,110,0.45)] hover:bg-teal-800",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200/70",
    danger:
      "bg-red-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(185,28,28,0.3),0_4px_12px_-4px_rgba(185,28,28,0.4)] hover:bg-red-700",
    outline:
      "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-slate-50 hover:ring-slate-300 dark:bg-transparent dark:text-foreground dark:ring-white/15",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  const sizes = {
    sm: "h-8 px-3 text-[12.5px] gap-1.5",
    md: "h-10 px-4 text-[13.5px] gap-2",
    lg: "h-11 px-5 text-sm gap-2",
  };

  return (
    <button
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium tracking-[-0.005em]",
        "transition-[background-color,box-shadow,color,transform] duration-150 active:scale-[0.985]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-500/25",
        "disabled:opacity-45 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
