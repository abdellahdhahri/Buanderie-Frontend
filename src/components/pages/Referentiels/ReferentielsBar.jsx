import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useReferentiels, CHEMIN_HUB_REFERENTIELS } from "./useReferentiels";
import "./Referentiels.css";

export function ReferentielsBar() {
  const { t } = useTranslation();
  const { items } = useReferentiels();
  if (!items.length) return null;
  return (
    <nav className="ref-bar" aria-label="Référentiels">
      <NavLink to={CHEMIN_HUB_REFERENTIELS} className="ref-chip ref-chip--hub" title={t("referentiels.all", "Tous les référentiels")}>
        <span className="ref-chip__icon"><LayoutGrid size={15} /></span>
      </NavLink>
      {items.map((it) => (
        <NavLink key={it.path} to={it.path} className={({ isActive }) => `ref-chip ${isActive ? "is-active" : ""}`}>
          <span className="ref-chip__icon">{it.icon}</span>
          <span>{it.titre}</span>
        </NavLink>
      ))}
    </nav>
  );
}
