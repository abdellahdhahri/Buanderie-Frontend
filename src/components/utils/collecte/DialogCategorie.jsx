import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ShieldAlert, Sparkles } from "lucide-react";
import { CATEGORIES_INFECTE } from "../../../constants/collecte";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { getActiveCategories } from "../../../utils/appSettings";
import "./DialogCategorie.css";

import drapImage from "../../../assets/linges/drap.png";
import taieImage from "../../../assets/linges/taie.png";
import servietteBainImage from "../../../assets/linges/sbain.png";
import servietteVisageImage from "../../../assets/linges/svisage.png";
import peignoirImage from "../../../assets/linges/PEIGNOIR.png";
import nappeImage from "../../../assets/linges/nape.png";
import servietteTableImage from "../../../assets/linges/serviettetable.png";
import uniformeImage from "../../../assets/linges/tenue-de-bloc.jpg";
import champOperatoireImage from "../../../assets/linges/champoperatoir.jpg";
import autreImage from "../../../assets/linges/uniforme.png";

const CATEGORY_IMAGES = {
  DRAP: drapImage,
  TAIE_OREILLER: taieImage,
  CHAMP_OPERATOIRE: champOperatoireImage,
  SERVIETTE_BAIN: servietteBainImage,
  SERVIETTE_VISAGE: servietteVisageImage,
  PEIGNOIR: peignoirImage,
  NAPPE: nappeImage,
  SERVIETTE_TABLE: servietteTableImage,
  UNIFORME: uniformeImage,
  AUTRE: autreImage,
};

const GROUPES = [
  { id: "LITERIE", cats: ["DRAP", "TAIE_OREILLER", "COUETTE"] },
  { id: "BLOC", cats: ["CHAMP_OPERATOIRE", "UNIFORME"] },
  { id: "TOILETTE", cats: ["SERVIETTE_BAIN", "SERVIETTE_VISAGE", "PEIGNOIR"] },
  { id: "RESTAURATION", cats: ["NAPPE", "SERVIETTE_TABLE"] },
  { id: "DIVERS", cats: ["AUTRE"] },
];

const NOUVELLES = ["COUETTE", "CHAMP_OPERATOIRE"];

function Visuel({ cat, label }) {
  const [erreur, setErreur] = useState(false);
  const src = CATEGORY_IMAGES[cat.id];
  const { Icon } = getCategorieMeta(cat.id);

  if (src && !erreur) {
    return <img src={src} alt={label} onError={() => setErreur(true)} />;
  }
  return <Icon size={30} strokeWidth={1.8} color={cat.color} />;
}

export default function DialogCategorie({ onChoisir, onFermer }) {
  const { t } = useTranslation();

  const groupes = useMemo(() => {
    const actives = getActiveCategories();
    const parId = Object.fromEntries(CATEGORIES_INFECTE.map((c) => [c.id, c]));
    let rang = 0;
    return GROUPES.map((g) => ({
      ...g,
      items: g.cats
        .filter((id) => parId[id] && actives.includes(id))
        .map((id) => ({ cat: parId[id], rang: ++rang })),
    })).filter((g) => g.items.length);
  }, []);

  const libelle = (cat) => t(`categories.${cat.id}`, { defaultValue: cat.label });

  const choisir = (cat) => onChoisir({ ...cat, label: libelle(cat) });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return onFermer?.();
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const cible = groupes.flatMap((g) => g.items).find((i) => i.rang === (n === 0 ? 10 : n));
      if (cible) choisir(cible.cat);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="dcat-overlay" onClick={onFermer}>
      <div className="dcat-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="dcat-head">
          <div className="dcat-head__icon">
            <ShieldAlert size={22} strokeWidth={2.2} />
          </div>
          <div className="dcat-head__text">
            <h3>{t("collecte.cat_dlg_title")}</h3>
            <p>{t("collecte.cat_dlg_sub")}</p>
          </div>
          <button type="button" className="dcat-close" onClick={onFermer} aria-label="close">
            <X size={18} />
          </button>
        </header>

        <div className="dcat-body">
          {groupes.map((g) => (
            <section key={g.id} className="dcat-group">
              <div className="dcat-group__title">
                <span>{t(`collecte.cat_grp_${g.id}`)}</span>
                <i />
              </div>
              <div className="dcat-grid">
                {g.items.map(({ cat, rang }) => {
                  const label = libelle(cat);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className="dcat-card"
                      style={{ "--c": cat.color, "--c-bg": cat.bg, "--c-bd": cat.border }}
                      onClick={() => choisir(cat)}
                    >
                      {rang <= 10 && <kbd className="dcat-card__key">{rang === 10 ? 0 : rang}</kbd>}
                      {NOUVELLES.includes(cat.id) && (
                        <span className="dcat-card__new">
                          <Sparkles size={10} />
                          {t("collecte.cat_dlg_new")}
                        </span>
                      )}
                      <span className="dcat-card__visual">
                        <Visuel cat={cat} label={label} />
                      </span>
                      <span className="dcat-card__label">{label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className="dcat-foot">{t("collecte.cat_dlg_hint")}</footer>
      </div>
    </div>
  );
}
