import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop overlay with blur */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] transition-all duration-300 animate-in fade-in" onClick={onClose} />
      
      {/* Modal container */}
      <div
        className={cn(
          "popup-modal relative w-full bg-white/85 backdrop-blur-xl rounded-[24px] border-[1.5px] border-emerald-500/20 shadow-[0_24px_60px_-12px_rgba(13,148,136,0.14)] overflow-hidden transition-all duration-300 animate-in zoom-in-95 ease-out",
          sizes[size]
        )}
        style={{ animationDuration: "200ms" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100/60">
          <h2 className="text-lg font-bold tracking-tight text-emerald-950">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-[#ccfbf1]/50 rounded-full transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
