import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Boxes, ChevronRight, MapPin, PackageCheck, RefreshCw, Warehouse } from "lucide-react";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { fetchArsenaux, fetchEmplacements } from "../../services/receptionArsenalService";
import { EmptyState } from "./arsenalUi";
import { Illustration } from "./illustrations";
import RangementArsenal from "./RangementArsenal";
import StockArsenalView from "./StockArsenalView";
import LocaliserLinge from "./LocaliserLinge";
import "../Linge/WorkflowList.css";
import "./StockageArsenal.css";

const TABS = [
  { id: "rangement", Icon: PackageCheck, needsArsenal: true },
  { id: "stock", Icon: Boxes, needsArsenal: true },
  { id: "localiser", Icon: MapPin, needsArsenal: false },
];

/** Choix de l'arsenal : liste compacte, touches 1…9 comme raccourcis. */
function ArsenalPicker({ arsenaux, loading, onReload, onSelect }) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < Math.min(arsenaux.length, 9)) onSelect(arsenaux[idx]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arsenaux, onSelect]);

  return (
    <section className="sa-stage sa-picker">
      <div className="sa-stage__head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <span className="sa-eyebrow">{t("stockageArsenal.before_start")}</span>
          <h2 className="sa-stage__title">{t("stockageArsenal.choose_arsenal")}</h2>
          <p className="sa-stage__text">{t("stockageArsenal.choose_arsenal_hint")}</p>
        </div>
        <button type="button" className="sa-btn sa-btn--sm" onClick={onReload} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t("common.refresh")}
        </button>
        <div className="sa-stage__art">
          <Illustration kind="arsenal" />
        </div>
      </div>

      {loading ? (
        <div className="sa-picks">
          {[0, 1, 2].map((i) => <div key={i} className="sa-skeleton" style={{ height: 64 }} />)}
        </div>
      ) : arsenaux.length === 0 ? (
        <EmptyState title={t("stockageArsenal.no_arsenals")} />
      ) : (
        <div className="sa-picks">
          {arsenaux.map((a, i) => (
            <motion.button
              key={a.id}
              type="button"
              className="sa-pick"
              onClick={() => onSelect(a)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
            >
              <span className="sa-pick__icon"><Warehouse size={18} /></span>
              <span className="sa-pick__name">{a.designation}</span>
              {i < 9 && <kbd className="sa-kbd">{i + 1}</kbd>}
              <ChevronRight size={18} className="sa-pick__go" />
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function StockageArsenal() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("rangement");

  const [arsenaux, setArsenaux] = useState([]);
  const [loadingArsenaux, setLoadingArsenaux] = useState(true);
  const [arsenal, setArsenalState] = useState(null);
  const [emplacements, setEmplacements] = useState([]);

  const loadArsenaux = () => {
    setLoadingArsenaux(true);
    return fetchArsenaux()
      .then(setArsenaux)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingArsenaux(false));
  };

  useEffect(() => {
    fetchArsenaux()
      .then(setArsenaux)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingArsenaux(false));
  }, []);

  // Choix / changement d'arsenal : on recharge ses étagères
  const setArsenal = (a) => {
    setArsenalState(a);
    setEmplacements([]);
    if (!a) return;
    fetchEmplacements(a.id)
      .then(setEmplacements)
      .catch((e) => toast.error(e.message));
  };

  const currentTab = TABS.find((x) => x.id === tab);

  return (
    <div className="collecte-container sa-page">
      {/* En-tête : titre + arsenal courant + onglets */}
      <header className="page-head sa-topbar">
        <div className="sa-header">
          <PageHeaderIcon size={44} radius={14} />
          <div style={{ minWidth: 0 }}>
            <h1>{t("stockageArsenal.title")}</h1>
            <p>
              {arsenal ? (
                <>
                  <Warehouse size={13} style={{ verticalAlign: "-2px", marginInlineEnd: 6 }} />
                  {arsenal.designation}
                  <button type="button" className="sa-link" style={{ marginInlineStart: 10 }} onClick={() => setArsenal(null)}>
                    {t("stockageArsenal.change_arsenal")}
                  </button>
                </>
              ) : (
                t("stockageArsenal.subtitle")
              )}
            </p>
          </div>
        </div>

        <nav role="tablist" className="sa-tabs">
          {TABS.map(({ id, Icon }) => {
            const active = id === tab;
            return (
              <button key={id} role="tab" aria-selected={active} type="button" className={`sa-tab ${active ? "is-active" : ""}`} onClick={() => setTab(id)}>
                <Icon size={16} />
                <span>{t(`stockageArsenal.tabs.${id}`)}</span>
                {active && <motion.span layoutId="sa-tab-line" className="sa-tab__line" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              </button>
            );
          })}
        </nav>
      </header>

      {currentTab.needsArsenal && !arsenal && (
        <ArsenalPicker arsenaux={arsenaux} loading={loadingArsenaux} onReload={loadArsenaux} onSelect={setArsenal} />
      )}

      {/* Rangement reste monté (masqué) pour ne pas perdre un rangement en cours en changeant d'onglet */}
      {arsenal && (
        <div style={{ display: tab === "rangement" ? "block" : "none" }}>
          <RangementArsenal key={arsenal.id} arsenal={arsenal} emplacements={emplacements} />
        </div>
      )}
      {arsenal && tab === "stock" && <StockArsenalView key={arsenal.id} arsenal={arsenal} />}
      {tab === "localiser" && <LocaliserLinge />}
    </div>
  );
}
