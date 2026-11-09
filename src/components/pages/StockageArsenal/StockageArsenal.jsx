import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Boxes, ChevronRight, MapPin, PackageCheck, RefreshCw, Warehouse, ArrowLeftRight } from "lucide-react";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { Page, PageHeader, ActionBar, ActionButton, Tabs, DataTable, VueSwitch, useVue, RowActions, RowButton } from "../../kit";
import { fetchArsenaux, fetchEmplacements } from "../../../services/receptionArsenalService";
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

function ArsenalPicker({ arsenaux, loading, onSelect }) {
  const { t } = useTranslation();
  const [vue, setVue] = useVue("stockage.arsenaux");

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
        <VueSwitch value={vue} onChange={setVue} />
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
      ) : vue === "tableau" ? (
        <DataTable
          columns={{
            rang: { label: "#", render: (a) => arsenaux.indexOf(a) + 1 },
            designation: { label: t("stockageArsenal.arsenal"), render: (a) => <strong>{a.designation}</strong> },
            actions: {
              label: t("common.actions", "Actions"),
              render: (a) => (
                <RowActions>
                  <RowButton icon={ChevronRight} title={t("stockageArsenal.choose_arsenal")} onClick={() => onSelect(a)} />
                </RowActions>
              ),
            },
          }}
          rows={arsenaux}
          onRowDoubleClick={onSelect}
        />
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
    <Page className="sa-page">
      <PageHeader
        icon={<PageHeaderIcon size={40} />}
        title={t("stockageArsenal.title")}
        subtitle={arsenal ? `${t("stockageArsenal.arsenal")} : ${arsenal.designation}` : t("stockageArsenal.subtitle")}
        total={arsenal ? emplacements.length : undefined}
        totalLabel={t("stockageArsenal.shelves", "ÉTAGÈRES")}
      />

      <ActionBar>
        <ActionButton
          icon={<RefreshCw size={18} className={loadingArsenaux ? "animate-spin" : ""} />}
          label={t("common.refresh")}
          variant="details"
          disabled={loadingArsenaux}
          onClick={loadArsenaux}
        />
        <ActionButton
          icon={<ArrowLeftRight size={18} />}
          label={t("stockageArsenal.change_arsenal")}
          variant="modifier"
          disabled={!arsenal}
          onClick={() => setArsenal(null)}
        />
      </ActionBar>

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
        <div style={{ display: tab === "rangement" ? "block" : "none" }}>
          <RangementArsenal key={arsenal.id} arsenal={arsenal} emplacements={emplacements} />
        </div>
      )}
      {arsenal && tab === "stock" && <StockArsenalView key={arsenal.id} arsenal={arsenal} />}
      {tab === "localiser" && <LocaliserLinge />}
    </Page>
  );
}
