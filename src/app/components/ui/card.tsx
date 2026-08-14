import { cn } from "../../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-slate-200/50 bg-white/75 backdrop-blur-md text-card-foreground shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] min-w-0 overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("p-6 pb-2 flex items-center justify-between border-b border-slate-100/50", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn("text-base font-bold tracking-tight text-slate-800", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
