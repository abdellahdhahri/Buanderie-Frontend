import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BarChart3, Building2, Clock, Layers, Pause, Play, RefreshCw, Shirt } from "lucide-react";
import { fetchSuiviGlobal, fetchSuiviService } from "../../../services/suiviStockService";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { ZONES_STOCK, zoneLabel } from "../../../constants/zonesStock";
import ZoneMatrix from "./ZoneMatrix";
import ZoneIcon from "./ZoneIcon";
import LingesModal from "./LingesModal";
import {
  Page, ActionBar, ActionButton, FilterPanel, FilterRow, FilterText,
  DetailAlert, Tabs, QuickStats, Button,
} from "../../kit";
import "../Reception/Reception.css";
import "./SuiviStock.css";

const REFRESH_MS = 30000;

const normalizeText = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function formatCalcul(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString("fr-FR")} · ${d.toLocaleTimeString("fr-FR")}`;
}

const fmtPct = (n, total) => {
  const p = total > 0 ? (n / total) * 100 : 0;
  return `${p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)} %`;
};

export default function SuiviStock() {
  const { t } = useTranslation();
  const [global, setGlobal] = useState(null);
  const [serviceView, setServiceView] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [onglet, setOnglet] = useState("categories");
  const [modalFilter, setModalFilter] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const serviceId = serviceView?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSuiviGlobal(), serviceId != null ? fetchSuiviService(serviceId) : null])
      .then(([g, s]) => {
        if (cancelled) return;
        setGlobal(g);
        setServiceData(s ? { id: serviceId, data: s } : null);
        setError(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setRefreshing(false));
    return () => { cancelled = true; };
  }, [serviceId, tick]);

  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => { if (!document.hidden) setTick((n) => n + 1); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto]);

  const refresh = () => { setRefreshing(true); setTick((n) => n + 1); };
  const openService = (row) => {
    setServiceView({ id: row.key, name: row.label });
    setServiceData(null);
    setOnglet("categories");
  };
  const backToGlobal = () => { setServiceView(null); setServiceData(null); };

  const current = serviceView ? (serviceData?.id === serviceId ? serviceData.data : null) : global;
  const openLinges = (filter) => setModalFilter({
    ...filter,
    serviceId: serviceView ? serviceView.id : undefined,
    serviceName: serviceView ? serviceView.name : undefined,
  });

  const zoneRows = useMemo(() => ZONES_STOCK.map((z) => ({
    key: z.id, zone: z, count: current?.parZone?.[z.id] || 0,
  })), [current]);

  const categorieRows = useMemo(() => (current?.parCategorie || []).map((c) => ({
    key: c.categorie,
    label: t(`categories.${c.categorie}`, c.categorie),
    color: accentOf(c.categorie),
    parZone: c.parZone,
    total: c.total,
  })), [current, t]);

  const serviceRows = useMemo(() => {
    const q = normalizeText(search.trim());
    return (global?.services || [])
      .filter((s) => !q || normalizeText(s.service).includes(q))
      .map((s) => ({ key: s.serviceId, label: s.service || `${t("suiviStock.service")} ${s.serviceId}`, parZone: s.parZone, total: s.totalParc }));
  }, [global, search, t]);

  const totalParc = current?.totalParc || 0;

  const champsZones = zoneRows.map((r) => ({
    key: r.key,
    label: zoneLabel(t, r.zone.id),
    icon: <ZoneIcon zone={r.zone.id} size={16} />,
    color: r.zone.color,
    value: r.count.toLocaleString("fr-FR"),
    hint: fmtPct(r.count, totalParc),
    pct: totalParc > 0 ? (r.count / totalParc) * 100 : 0,
    onClick: r.count ? () => openLinges({ zone: r.zone.id }) : undefined,
    title: t("suiviStock.see_linges"),
  }));

  const ongletsDisponibles = [
    { value: "categories", icon: <Shirt size={15} />, label: t("suiviStock.by_category"), count: categorieRows.length },
    ...(!serviceView ? [{ value: "services", icon: <Building2 size={15} />, label: t("suiviStock.by_service"), count: serviceRows.length }] : []),
  ];

  return (
    <Page className="rc ss">
      <ActionBar>
        {serviceView && <ActionButton icon={<ArrowLeft size={18} />} label={t("suiviStock.back_global")} variant="details" onClick={backToGlobal} />}
        <ActionButton icon={<Layers size={18} />} label={t("suiviStock.see_linges")} variant="details" disabled={!totalParc} onClick={() => openLinges({})} />
        <ActionButton icon={<BarChart3 size={18} />} label={t("kit.stats", "Statistiques")} variant="rapport-global" disabled={!current} onClick={() => setShowStats(true)} />
        <ActionButton icon={<RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />} label={t("suiviStock.refresh")} variant="details" disabled={refreshing} onClick={refresh} />
        <ActionButton
          icon={auto ? <Pause size={18} /> : <Play size={18} />}
          label={auto ? `${t("suiviStock.auto_on")} · ${t("suiviStock.pause")}` : `${t("suiviStock.auto_off")} · ${t("suiviStock.resume")}`}
          variant={auto ? "etat-accepter" : "modifier"}
          onClick={() => setAuto((a) => !a)}
        />
      </ActionBar>

      {error && (
        <DetailAlert title={global ? t("suiviStock.refresh_failed") : t("suiviStock.load_error")}>
          <p>{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={refresh}>{t("suiviStock.retry")}</Button>
        </DetailAlert>
      )}

      {current ? (
        <section className="rc-card ss-zones">
          <header className="ss-zones__head">
            <h3 className="rc-card__title">
              {serviceView ? <><Building2 size={15} /> {serviceView.name}</> : t("suiviStock.repartition", "Répartition par zone")}
            </h3>
            <span className="ss-zones__total"><b>{totalParc.toLocaleString("fr-FR")}</b> {t("suiviStock.linges_unit", "linges")}</span>
            <span className="ss-zones__calc"><Clock size={13} /> {formatCalcul(current.dateCalcul)}</span>
          </header>
          <div className="ss-zones__grid">
            {champsZones.map((z) => (
              <button
                key={z.key}
                type="button"
                className="ss-zone"
                style={{ "--z": z.color }}
                disabled={!z.onClick}
                onClick={z.onClick}
                title={z.title}
              >
                <span className="ss-zone__top">
                  <span className="ss-zone__icon">{z.icon}</span>
                  <span className="ss-zone__label">{z.label}</span>
                </span>
                <span className="ss-zone__value">{z.value}</span>
                <span className="ss-zone__bar"><i style={{ width: `${z.pct}%` }} /></span>
                <span className="ss-zone__hint">{z.hint}</span>
              </button>
            ))}
          </div>
        </section>
      ) : !error && (
        <section className="rc-card ss-zones" aria-busy="true">
          <div className="rc-loading">{t("common.loading")}</div>
        </section>
      )}

      <div className="kit-toolbar">
        <Tabs items={ongletsDisponibles} value={onglet} onChange={setOnglet} />
        {onglet === "categories" && <span className="kit-muted" style={{ fontSize: ".8rem" }}>{t("suiviStock.click_cell")}</span>}
      </div>

      {onglet === "services" && (
        <FilterPanel>
          <FilterRow>
            <FilterText label={t("suiviStock.service")} placeholder={t("suiviStock.search_service")} value={search} onChange={setSearch} />
          </FilterRow>
        </FilterPanel>
      )}

      <div className="employee-list-section">
        {onglet === "categories" && (
          <ZoneMatrix
            rows={categorieRows}
            firstColumn={t("suiviStock.category")}
            onCellClick={(row, zone) => openLinges({ zone, categorie: row.key })}
            emptyText={t("suiviStock.empty")}
          />
        )}
        {onglet === "services" && (
          <ZoneMatrix
            rows={serviceRows}
            firstColumn={t("suiviStock.service")}
            onRowClick={openService}
            emptyText={search ? t("suiviStock.no_service_match") : t("suiviStock.no_services")}
          />
        )}
      </div>

      {modalFilter && <LingesModal key={JSON.stringify(modalFilter)} filter={modalFilter} onClose={() => setModalFilter(null)} />}

      {showStats && current && (
        <QuickStats
          title={serviceView ? `${t("suiviStock.title")} · ${serviceView.name}` : t("suiviStock.title")}
          subtitle={`${t("suiviStock.last_calc")} : ${formatCalcul(current.dateCalcul)}`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("suiviStock.total_parc"), value: totalParc.toLocaleString("fr-FR") },
            ...ZONES_STOCK.slice(0, 3).map((z) => ({ label: zoneLabel(t, z.id), value: (current.parZone?.[z.id] || 0).toLocaleString("fr-FR"), color: z.color })),
          ]}
          repartitions={[{ title: t("suiviStock.repartition"), items: ZONES_STOCK.map((z) => ({ label: zoneLabel(t, z.id), value: current.parZone?.[z.id] || 0, color: z.color })) }]}
          classements={[{ title: t("suiviStock.by_category"), items: categorieRows.map((c) => ({ label: c.label, value: c.total })).sort((a, b) => b.value - a.value) }]}
        />
      )}
    </Page>
  );
}
