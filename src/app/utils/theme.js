

const STORAGE_KEY = "theme";
const EVENT = "themechange";
const MODES = ["light", "dark", "system"];

const systemQuery = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

export function getThemeMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(saved) ? saved : "light";
  } catch {
    return "light";
  }
}

const resolveDark = (mode) => mode === "dark" || (mode === "system" && !!systemQuery()?.matches);

export const isDarkTheme = () => document.documentElement.classList.contains("dark");

let transitionTimer;

// Applique le thème ; `animate` ajoute un fondu des couleurs le temps du changement
function apply(mode, animate) {
  const root = document.documentElement;
  const dark = resolveDark(mode);

  if (animate) {
    root.classList.add("theme-transition");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove("theme-transition"), 350);
  }

  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { dark, mode } }));
}

export function setThemeMode(mode) {
  if (!MODES.includes(mode)) return;
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* stockage indisponible */ }
  apply(mode, true);
}

// Raccourci utilisé par le bouton soleil/lune de l'en-tête
export function setDarkTheme(dark) {
  setThemeMode(dark ? "dark" : "light");
}

// Au démarrage : réapplique le mode mémorisé et suit l'OS en mode "system"
export function applySavedTheme() {
  apply(getThemeMode(), false);
  systemQuery()?.addEventListener?.("change", () => {
    if (getThemeMode() === "system") apply("system", true);
  });
}

// Abonnement : callback(dark, mode) ; renvoie la fonction de désabonnement
export function onThemeChange(callback) {
  const handler = (e) => callback(e.detail.dark, e.detail.mode);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
