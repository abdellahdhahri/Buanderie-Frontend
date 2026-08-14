import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: KPICardProps) {
  const iconWrappers = {
    default: "bg-[#eef2ff] text-[#3b5bdb]",     // Blue / RH
    success: "bg-[#e6fcf5] text-[#0ca678]",     // Green / Paie
    warning: "bg-[#fff8eb] text-[#e67700]",     // Orange / Presences
    danger: "bg-[#fff5f5] text-[#e03131]",      // Red / Congés
    info: "bg-[#f3f0ff] text-[#6741d9]",        // Purple / Params
  };

  const trendStyles = trend !== undefined
    ? trend >= 0
      ? "bg-[#e6fcf5] text-[#0ca678]"
      : "bg-[#fff5f5] text-[#e03131]"
    : "";

  return (
    <div
      className={cn(
        "param-icon-card flex flex-col items-stretch justify-between transition-all duration-300",
        className
      )}
      style={{ cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "24px 30px" }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </span>
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                trendStyles
              )}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
            <span className="text-[11px] text-slate-400 ml-2 font-medium">depuis le mois dernier</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0",
          iconWrappers[variant]
        )}
        style={{ border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
      >
        <Icon className="w-6 h-6 stroke-[2]" />
      </div>
    </div>
  );
}
