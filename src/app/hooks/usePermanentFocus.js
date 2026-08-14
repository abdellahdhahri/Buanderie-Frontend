import { useEffect } from "react";

/**
 * Maintient le focus sur un input de manière permanente.
 * Ignore le vol de focus si une modal [data-modal="true"] est ouverte.
 */
export function usePermanentFocus(ref, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref?.current) return;
    const restore = () => {
      const modal = document.querySelector('[data-modal="true"]');
      if (!modal && ref.current) ref.current.focus();
    };
    document.addEventListener("click", restore);
    setTimeout(() => ref.current?.focus(), 100);
    return () => document.removeEventListener("click", restore);
  }, [enabled]);
}
