const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const SESSION_EXPIREE = /Session CUBIX expir[ée]e|Aucune session CUBIX/i;
const ROUTES_PUBLIQUES = ["/api/auth/login", "/api/auth/logout"];

export const lireToken = () => {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null")?.token || null;
  } catch {
    return null;
  }
};

const DELAI_LOGOUT_MS = 3000;

export const appelerLogout = async (token) => {
  if (!token) return;
  try {
    const requete = fetch(`${API_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    await Promise.race([requete, new Promise((resolve) => setTimeout(resolve, DELAI_LOGOUT_MS))]);
  } catch {}
};

export const effacerSession = () => {
  try {
    localStorage.removeItem("auth");
    localStorage.removeItem("agent");
  } catch {}
  window.dispatchEvent(new Event("authChanged"));
};

let sessionEnCours = false;

export const viderSession = async () => {
  if (sessionEnCours) return;
  sessionEnCours = true;
  await appelerLogout(lireToken());
  effacerSession();
  if (window.location.pathname !== "/auth") window.location.href = "/auth";
};

const urlDe = (input) => (typeof input === "string" ? input : input?.url || String(input || ""));

export function installerSessionGuard() {
  if (window.__sessionGuardInstalle) return;
  window.__sessionGuardInstalle = true;
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = urlDe(input);
    const versApi = url.startsWith(API_URL);
    const token = lireToken();
    let options = init;

    if (versApi && token && typeof input === "string" && !ROUTES_PUBLIQUES.some((r) => url.includes(r))) {
      const headers = new Headers(init.headers || {});
      if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
      options = { ...init, headers };
    }

    const response = await fetchOriginal(input, options);

    if (versApi && !response.ok && token && !ROUTES_PUBLIQUES.some((r) => url.includes(r))) {
      if (response.status === 401) {
        viderSession();
      } else {
        const texte = await response.clone().text().catch(() => "");
        if (SESSION_EXPIREE.test(texte)) viderSession();
      }
    }
    return response;
  };
}
