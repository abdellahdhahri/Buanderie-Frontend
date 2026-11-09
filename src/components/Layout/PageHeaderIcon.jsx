import React from "react";
import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../constants/navigation";

// Couleur de chaque section du menu (identique à layout.css : --color-<section>)
const SECTION_COLORS = {
  rh:        { from: "#5c7cfa", to: "#3b5bdb", shadow: "59, 91, 219" },   // Tableau de bord
  params:    { from: "#8b5cf6", to: "#6741d9", shadow: "103, 65, 217" },  // Paramétrage
  suivi:     { from: "#38bdf8", to: "#0ea5e9", shadow: "14, 165, 233" },  // Suivi
  presences: { from: "#fd9a2b", to: "#e67700", shadow: "230, 119, 0" },   // Zone sale
  paie:      { from: "#20c997", to: "#0ca678", shadow: "12, 166, 120" },  // Zone propre
  conges:    { from: "#f25555", to: "#e03131", shadow: "224, 49, 49" },   // Reporting
};

// Pages hors menu → page du menu à laquelle elles se rattachent
const ROUTE_ALIASES = {
  "/service": "/collecteList",
  "/uniforme": "/collecteList",
  "/collages": "/collecteList",
  "/distuniforme": "/distribution",
  "/distchambre": "/distribution",
  "/livraisons": "/remise",
  "/stock": "/arsenal",
  "/reclamationsgestion": "/reclamations",
};

const norm = (p = "") => p.toLowerCase().replace(/\/+$/, "") || "/";

// Retrouve la section et l'entrée du menu correspondant à un chemin
export function findNavEntry(pathname) {
  const path = norm(ROUTE_ALIASES[norm(pathname)] ?? pathname);
  for (const section of NAV_ITEMS) {
    if (section.path && norm(section.path) === path) return { section, entry: section };
    const child = section.children?.find((c) => norm(c.path) === path);
    if (child) return { section, entry: child };
  }
  return null;
}

// Libellé propre des pages hors menu (clé navigation.*) ; la page parente vient de ROUTE_ALIASES
const OFF_MENU_LABELS = {
  "/service": "Collecte service",
  "/uniforme": "Collecte uniformes",
  "/collages": "Collecte linge",
  "/distuniforme": "Distribution uniformes",
  "/distchambre": "Distribution chambres",
  "/livraisons": "Historique livraisons",
  "/reclamationsgestion": "Gestion réclamations",
};

// Pages hors menu rattachées directement à une section
const OFF_MENU_SECTIONS = {
  "/agents": { section: "params", label: "Agents" },
  "/immo": { section: "suivi", label: "Matériel" },
};

// Pages autonomes (ni section ni parent)
const STANDALONE_PAGES = {
  "/parametres": "Paramètres",
  "/proc": "Workflow",
  "/process": "Workflow",
};

const sectionCrumb = (section) => ({
  key: `navigation.${section.id}`,
  fallback: section.label,
  // Une section n'a pas de page : elle mène à sa première sous-page
  path: section.children?.[0]?.path ?? null,
});
const pageCrumb = (label, path = null) => ({ key: `navigation.${label}`, fallback: label, path });

/**
 * Fil d'Ariane d'un chemin (sans « Accueil ») : [section, page, sous-page…].
 * Chaque élément : { key, fallback, path } — path null pour l'élément courant.
 */
export function getBreadcrumbTrail(pathname) {
  const path = norm(pathname);
  if (path === "/") return [];

  let trail = [];
  const found = findNavEntry(path);
  if (found) {
    const { section, entry } = found;
    if (section !== entry) trail.push(sectionCrumb(section));
    trail.push(pageCrumb(entry.label, entry.path));
    if (OFF_MENU_LABELS[path]) trail.push(pageCrumb(OFF_MENU_LABELS[path]));
  } else if (OFF_MENU_SECTIONS[path]) {
    const { section: id, label } = OFF_MENU_SECTIONS[path];
    const section = NAV_ITEMS.find((s) => s.id === id);
    if (section) trail.push(sectionCrumb(section));
    trail.push(pageCrumb(label));
  } else if (STANDALONE_PAGES[path]) {
    trail.push(pageCrumb(STANDALONE_PAGES[path]));
  } else {
    // Route inconnue : dernier segment de l'URL
    const segment = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
    trail.push({ key: null, fallback: segment.charAt(0).toUpperCase() + segment.slice(1), path: null });
  }

  // Le dernier élément est la page courante : pas de lien
  trail[trail.length - 1] = { ...trail[trail.length - 1], path: null };
  return trail;
}

export function getSectionColors(sectionId) {
  return SECTION_COLORS[sectionId] ?? SECTION_COLORS.paie;
}

/**
 * Icône d'en-tête de page : même icône que dans le menu, sur un dégradé
 * de la couleur de la section parente.
 *   path    : forcer un chemin (sinon la route courante)
 *   section : forcer une section ("presences", "paie"…)
 *   icon    : forcer une icône (élément React)
 */
export function PageHeaderIcon({ size = 52, path, section, icon, radius }) {
  const location = useLocation();
  const found = findNavEntry(path ?? location.pathname);
  const colors = getSectionColors(section ?? found?.section.id);
  const glyph = icon ?? found?.entry.icon ?? found?.section.icon;
  const glyphSize = Math.round(size * 0.5);

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.31),
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
        boxShadow: `0 6px 18px rgba(${colors.shadow}, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {glyph &&
        React.cloneElement(glyph, {
          style: { width: glyphSize, height: glyphSize, ...(glyph.props.style || {}) },
        })}
    </div>
  );
}
