import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Boxes, ChevronRight, MapPin, PackageCheck, RefreshCw, Warehouse, ArrowLeftRight } from "lucide-react";
import { Page, Tabs } from "../../kit";
import "../Reception/Reception.css";
import { fetchArsenaux, fetchEmplacements } from "../../../services/receptionArsenalService";
import { EmptyState, Hero, Loading, Panel } from "./arsenalUi";
import RangementArsenal from "./RangementArsenal";
import StockArsenalView from "./StockArsenalView";
import LocaliserLinge from "./LocaliserLinge";
import "../Linge/WorkflowList.css";
import "./StockageArsenal.css";
import "./StockageArsenalV2.css";

const TABS = [
  { id: "rangement", Icon: PackageCheck, needsArsenal: true },
  { id: "stock", Icon: Boxes, needsArsenal: true },
  { id: "localiser", Icon: MapPin, needsArsenal: false },
];

function ArsenalPicker({ arsenaux, loading, onSelect }) {
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
    <Panel>
      <Hero art="locate" title={t("stockageArsenal.choose_arsenal")}>
        {loading ? (
          <Loading />
        ) : arsenaux.length === 0 ? (
          <EmptyState title={t("stockageArsenal.no_arsenals")} />
        ) : (
          <div className="sa-picks">
            {arsenaux.map((a, i) => (
              <button key={a.id} type="button" className="sa-pick" onClick={() => onSelect(a)}>
                <span className="sa-pick__icon"><Warehouse size={20} /></span>
                <span className="sa-pick__name">{a.designation}</span>
                {i < 9 && <span className="sa-kbd">{i + 1}</span>}
                <ChevronRight size={17} className="sa-pick__go" />
              </button>
            ))}
          </div>
        )}
      </Hero>
    </Panel>
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
    <Page className="sa-page rc sa-v2">
      <div className="rc-toolbar">
        <div className="rc-head__right">
          {arsenal && <span className="rc-mode"><i /> {arsenal.designation} · {emplacements.length} {t("stockageArsenal.shelves", "étagères")}</span>}
          <button type="button" className="rc-btn" disabled={loadingArsenaux} onClick={loadArsenaux}>
            <RefreshCw size={15} className={loadingArsenaux ? "animate-spin" : ""} /> {t("common.refresh")}
          </button>
          <button type="button" className="rc-btn" disabled={!arsenal} onClick={() => setArsenal(null)}>
            <ArrowLeftRight size={15} /> {t("stockageArsenal.change_arsenal")}
          </button>
        </div>
      </div>

      <div className="kit-toolbar" style={{ marginBottom: 16 }}>
        <Tabs
          items={TABS.map(({ id, Icon }) => ({ value: id, label: t(`stockageArsenal.tabs.${id}`), icon: <Icon size={16} /> }))}
          value={tab}
          onChange={setTab}
        />
      </div>

      {currentTab.needsArsenal && !arsenal && (
        <ArsenalPicker arsenaux={arsenaux} loading={loadingArsenaux} onSelect={setArsenal} />
      )}

      {arsenal && (
        <div style={{ display: tab === "rangement" ? "block" : "none", width: "100%" }}>
          <RangementArsenal key={arsenal.id} arsenal={arsenal} emplacements={emplacements} />
        </div>
      )}
      {arsenal && tab === "stock" && <StockArsenalView key={arsenal.id} arsenal={arsenal} />}
      {tab === "localiser" && <LocaliserLinge />}
    </Page>
  );
}
