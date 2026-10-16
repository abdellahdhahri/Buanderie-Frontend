import React from "react";
import { useTranslation } from "react-i18next";
import { ClipboardX, X, Weight, Repeat, Tag, Building2, FileText } from "lucide-react";
import { ATTRIBUTS_INCOMPLETS } from "../../../services/analyseService";

// Libellé + icône de chaque attribut contrôlé
export const ATTRIBUT_META = {
  POIDS:       { fr: "Poids", Icon: Weight },
  DUREE_VIE:   { fr: "Durée de vie", Icon: Repeat },
  CATEGORIE:   { fr: "Catégorie", Icon: Tag },
  SERVICE:     { fr: "Service", Icon: Building2 },
  DESIGNATION: { fr: "Désignation", Icon: FileText },
};

export const useAttributLabel = () => {
  const { t } = useTranslation();
  return (a) => t(`linge.incomplets.attributs.${a}`, ATTRIBUT_META[a]?.fr || a);
};

/**
 * Bandeau du mode « linges incomplets » : total, filtre par attribut manquant
 * (avec le nombre de linges concernés) et sortie du mode.
 */
export function LingeIncompletsBanner({ resume, attribut, onAttributChange, onQuit }) {
  const { t } = useTranslation();
  const label = useAttributLabel();
  const parAttribut = resume?.parAttribut || {};
  const totalTous = resume?.totalTous ?? resume?.total;

  const chips = [
    { key: "", text: t("linge.incomplets.all", "Tous"), count: totalTous },
    ...ATTRIBUTS_INCOMPLETS.map((a) => ({ key: a, text: label(a), count: parAttribut[a], Icon: ATTRIBUT_META[a].Icon })),
  ];

  return (
    <div className="rounded-[20px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-[0_4px_20px_rgba(217,119,6,0.06)] dark:border-amber-500/30 dark:from-amber-500/10 dark:to-transparent">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-amber-500 text-white shadow-[0_6px_14px_-6px_rgba(217,119,6,0.7)]">
          <ClipboardX className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[15px] font-semibold text-slate-900 dark:text-foreground">
            {t("linge.incomplets.title", "Linges incomplets")}
            {totalTous != null && <span className="ml-2 text-amber-700 dark:text-amber-300">{totalTous}</span>}
          </p>
          <p className="m-0 text-[12.5px] text-slate-500 dark:text-muted-foreground">
            {t("linge.incomplets.subtitle", "Linges actifs dont au moins une information obligatoire manque. Corrigez-les avec « Modifier ».")}
          </p>
        </div>
        <button
          type="button"
          onClick={onQuit}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-border dark:bg-transparent"
        >
          <X className="h-4 w-4" />
          {t("linge.incomplets.quit", "Voir tous les linges")}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = attribut === c.key;
          return (
            <button
              key={c.key || "all"}
              type="button"
              onClick={() => onAttributChange(c.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                active
                  ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                  : "border-amber-200 bg-white text-amber-800 hover:border-amber-300 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-200"
              }`}
            >
              {c.Icon && <c.Icon className="h-3.5 w-3.5" />}
              {c.text}
              {c.count != null && (
                <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/25" : "bg-amber-100 dark:bg-amber-500/20"}`}>
                  {c.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
