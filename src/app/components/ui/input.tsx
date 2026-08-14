import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-11 px-4 rounded-[14px] border-1.5 border-slate-200 bg-slate-50/50 text-slate-800 text-sm transition-all duration-200",
          "placeholder:text-slate-400",
          "focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:ring-red-500/10",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
