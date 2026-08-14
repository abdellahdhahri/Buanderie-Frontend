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
    primary: "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-[0_4px_12px_rgba(7,148,164,0.15)] shadow-[0_2px_4px_rgba(7,148,164,0.08)]",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/40",
    danger: "bg-red-500 text-white hover:bg-red-650 hover:shadow-[0_4px_12px_rgba(224,49,49,0.15)] shadow-[0_2px_4px_rgba(224,49,49,0.08)]",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_2px_4px_rgba(0,0,0,0.01)]",
    ghost: "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs font-bold",
    md: "h-11 px-5 text-sm font-bold",
    lg: "h-12 px-6 text-base font-bold",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[14px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
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
