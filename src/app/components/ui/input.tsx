import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[12.5px] font-medium text-slate-600 dark:text-muted-foreground">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-10 px-3.5 rounded-[10px] bg-white text-[13.5px] text-slate-800",
          "border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
          "placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150",
          "hover:border-slate-300",
          "focus:outline-none focus:border-teal-500/70 focus:ring-[3px] focus:ring-teal-500/12",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          "dark:bg-card dark:border-border dark:text-foreground",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/12",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
