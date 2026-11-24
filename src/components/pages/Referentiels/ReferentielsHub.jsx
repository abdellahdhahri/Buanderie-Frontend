import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { Page, PageHeader } from "../../kit";
import { useReferentiels } from "./useReferentiels";
import "./Referentiels.css";

const DESCRIPTIONS = {
  "/services": "Services et chambres rattachés",
  "/bac": "Bacs de collecte et leurs linges",
  "/etape": "Étapes du circuit et personnel",
  "/bacs-tri": "Bacs utilisés au tri",
  "/machine": "Machines, états et signalements",
  "/programme": "Programmes de lavage et séchage",
  "/produits-nettoyage": "Lessives et produits utilisés",
  "/arsenal": "Arsenaux et emplacements",
  "/agents": "Personnel et badges",
  "/affectation-agents": "Agents par étape du circuit",
};

export default function ReferentielsHub() {
  const { t } = useTranslation();
  const { items, titreGroupe } = useReferentiels();
  return (
    <Page>
      <PageHeader
        icon={Layers}
        title={titreGroupe || t("referentiels.title", "Référentiels")}
        subtitle={t("referentiels.subtitle", "Choisissez la table à consulter ou à modifier.")}
        total={items.length}
      />
      <div className="ref-grid">
        {items.map((it) => (
          <Link key={it.path} to={it.path} className="ref-card">
            <span className="ref-card__icon">{it.icon}</span>
            <h3>{it.titre}</h3>
            <p>{t(`referentiels.desc.${it.path.slice(1)}`, DESCRIPTIONS[it.path] || "")}</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
