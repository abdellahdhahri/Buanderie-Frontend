import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BarChart3, Building2, Layers, Pause, Play, RefreshCw, Shirt } from "lucide-react";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { fetchSuiviGlobal, fetchSuiviService } from "../../../services/suiviStockService";
import { accentOf } from "../StockageArsenal/arsenalUtils";
import { ZONES_STOCK, zoneLabel } from "../../../constants/zonesStock";
import ZoneMatrix from "./ZoneMatrix";
import ZoneIcon from "./ZoneIcon";
import LingesModal from "./LingesModal";
import {
  Page, PageHeader, ActionBar, ActionButton, FilterPanel, FilterRow, FilterText,
  DataTable, DetailAlert, Tabs, QuickStats, Button,
} from "../../kit";

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
  const [onglet, setOnglet] = useState("zones");
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
    setOnglet("zones");
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

  const ZONE_COLUMNS = {
    zone: {
      label: t("suiviStock.repartition"),
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
          <span className="kit-zone-icon" style={{ "--z": r.zone.color }}><ZoneIcon zone={r.zone.id} size={16} /></span>
          {zoneLabel(t, r.zone.id)}
        </span>
      ),
    },
    count: { label: t("inventaire.linens_count", "Linges"), align: "right", render: (r) => <strong>{r.count.toLocaleString("fr-FR")}</strong> },
    part: {
      label: "%", align: "left",
      render: (r) => (
        <div style={{ minWidth: 140 }}>
          <span className="kit-muted" style={{ fontSize: ".8rem" }}>{fmtPct(r.count, totalParc)}</span>
          <div className="kit-gauge"><span style={{ width: fmtPct(r.count, totalParc).replace(" ", ""), background: r.zone.color }} /></div>
        </div>
      ),
    },
  };

  const ongletsDisponibles = [
    { value: "zones", icon: <Layers size={15} />, label: t("suiviStock.repartition") },
    { value: "categories", icon: <Shirt size={15} />, label: t("suiviStock.by_category"), count: categorieRows.length },
    ...(!serviceView ? [{ value: "services", icon: <Building2 size={15} />, label: t("suiviStock.by_service"), count: serviceRows.length }] : []),
  ];

  return (
    <Page>
      <PageHeader
        icon={<PageHeaderIcon size={40} />}
        title={serviceView ? `${t("suiviStock.title")} · ${serviceView.name}` : t("suiviStock.title")}
        subtitle={`${t("suiviStock.last_calc")} : ${formatCalcul(current?.dateCalcul ?? global?.dateCalcul)}`}
        badge={`${t("suiviStock.total_parc")} : ${totalParc.toLocaleString("fr-FR")}`}
        onBack={serviceView ? backToGlobal : undefined}
        backTitle={t("suiviStock.back_global")}
      />

      <ActionBar>
        {serviceView && <ActionButton icon={<ArrowLeft size={18} />} label={t("suiviStock.back_global")} variant="details" onClick={backToGlobal} />}
        <ActionButton icon={<RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />} label={t("suiviStock.refresh")} variant="details" disabled={refreshing} onClick={refresh} />
        <ActionButton
          icon={auto ? <Pause size={18} /> : <Play size={18} />}
          label={auto ? `${t("suiviStock.auto_on")} · ${t("suiviStock.pause")}` : `${t("suiviStock.auto_off")} · ${t("suiviStock.resume")}`}
          variant={auto ? "etat-accepter" : "modifier"}
          onClick={() => setAuto((a) => !a)}
        />
        <ActionButton icon={<BarChart3 size={18} />} label={t("kit.stats", "Statistiques")} variant="rapport-global" disabled={!current} onClick={() => setShowStats(true)} />
        <ActionButton icon={<Layers size={18} />} label={t("suiviStock.see_linges")} variant="imprimer" disabled={!totalParc} onClick={() => openLinges({})} />
      </ActionBar>

      {error && (
        <DetailAlert title={global ? t("suiviStock.refresh_failed") : t("suiviStock.load_error")}>
          <p>{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={refresh}>{t("suiviStock.retry")}</Button>
        </DetailAlert>
      )}

      <div className="kit-toolbar">
        <Tabs items={ongletsDisponibles} value={onglet} onChange={setOnglet} />
        {onglet !== "services" && <span className="kit-muted" style={{ fontSize: ".8rem" }}>{t("suiviStock.click_cell")}</span>}
      </div>

      {onglet === "services" && (
        <FilterPanel>
          <FilterRow>
            <FilterText label={t("suiviStock.service")} placeholder={t("suiviStock.search_service")} value={search} onChange={setSearch} />
          </FilterRow>
        </FilterPanel>
      )}

      <div className="employee-list-section">
        {onglet === "zones" && (
          <DataTable
            columns={ZONE_COLUMNS}
            rows={zoneRows}
            rowKey={(r) => r.key}
            onRowClick={(r) => r.count && openLinges({ zone: r.zone.id })}
            loading={!current && !error}
            loadingText={t("common.loading")}
            emptyText={t("suiviStock.empty")}
          />
        )}
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
