import React from "react";
import { useTranslation } from "react-i18next";
import { ClipboardX, X, Weight, Repeat, Tag, Building2, FileText } from "lucide-react";
import { ATTRIBUTS_INCOMPLETS } from "../../../../services/analyseService";
import { DetailAlert, Tabs, Button } from "../../../kit";

export const ATTRIBUT_META = {
  POIDS: { fr: "Poids", Icon: Weight },
  DUREE_VIE: { fr: "Durée de vie", Icon: Repeat },
  CATEGORIE: { fr: "Catégorie", Icon: Tag },
  SERVICE: { fr: "Service", Icon: Building2 },
  DESIGNATION: { fr: "Désignation", Icon: FileText },
};

export const useAttributLabel = () => {
  const { t } = useTranslation();
  return (a) => t(`linge.incomplets.attributs.${a}`, ATTRIBUT_META[a]?.fr || a);
};

export function LingeIncompletsBanner({ resume, attribut, onAttributChange, onQuit }) {
  const { t } = useTranslation();
  const label = useAttributLabel();
  const parAttribut = resume?.parAttribut || {};
  const totalTous = resume?.totalTous ?? resume?.total;
  const onglets = [
    { value: "", label: t("linge.incomplets.all", "Tous"), count: totalTous ?? undefined },
    ...ATTRIBUTS_INCOMPLETS.map((a) => {
      const Icon = ATTRIBUT_META[a].Icon;
      return { value: a, icon: <Icon size={14} />, label: label(a), count: parAttribut[a] ?? undefined };
    }),
  ];
  return (
    <div className="filter-panel-section">
      <DetailAlert icon={<ClipboardX size={20} />} title={`${t("linge.incomplets.title", "Linges incomplets")}${totalTous != null ? ` · ${totalTous}` : ""}`}>
        <p>{t("linge.incomplets.subtitle", "Linges actifs dont au moins une information obligatoire manque. Corrigez-les avec « Modifier ».")}</p>
      </DetailAlert>
      <div className="kit-toolbar" style={{ marginTop: 12, marginBottom: 0 }}>
        <Tabs items={onglets} value={attribut} onChange={onAttributChange} />
        <Button variant="secondary" icon={<X size={16} />} onClick={onQuit}>{t("linge.incomplets.quit", "Voir tous les linges")}</Button>
      </div>
    </div>
  );
}
