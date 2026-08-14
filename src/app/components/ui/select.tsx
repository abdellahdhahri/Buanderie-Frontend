import { cn } from "../../lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full h-11 pl-4 pr-10 rounded-[14px] border-1.5 border-slate-200 bg-slate-50/50 text-slate-800 text-sm transition-all duration-200 appearance-none cursor-pointer",
            "focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500/10",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom chevron dropdown icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
