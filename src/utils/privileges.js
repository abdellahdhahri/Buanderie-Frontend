// ═══════════════════════════════════════════════════════════════════════════
// Administrateur : privilège ADMIN / ALL, ou tous les privilèges des menus.
// L'écran Paramètres (/parametres) est réservé à l'administrateur.
// ═══════════════════════════════════════════════════════════════════════════

const FULL_ACCESS = ["ADMIN", "ALL"];

/** Codes de privilège utilisés par les menus (sections et sous-menus). */
export function privilegesDesMenus(navItems = []) {
  const codes = new Set();
  navItems.forEach((item) => {
    if (item.privilege) codes.add(item.privilege);
    (item.children || []).forEach((child) => child.privilege && codes.add(child.privilege));
  });
  return [...codes];
}

export function isAdministrateur(privileges = [], navItems = []) {
  if (!Array.isArray(privileges) || privileges.length === 0) return false;
  if (FULL_ACCESS.some((p) => privileges.includes(p))) return true;
  const requis = privilegesDesMenus(navItems);
  return requis.length > 0 && requis.every((code) => privileges.includes(code));
}
