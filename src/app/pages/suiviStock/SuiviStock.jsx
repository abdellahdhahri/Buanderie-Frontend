import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Building2, Pause, Play, RefreshCw, Search, Shirt, X } from "lucide-react";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";
import { fetchSuiviGlobal, fetchSuiviService } from "../../services/suiviStockService";
import { EmptyState, Panel } from "../stockageArsenal/arsenalUi";
import { accentOf } from "../stockageArsenal/arsenalUtils";
import ZoneCards from "./ZoneCards";
import RepartitionBar from "./RepartitionBar";
import ZoneMatrix from "./ZoneMatrix";
import LingesModal from "./LingesModal";
import "../stockageArsenal/StockageArsenal.css";
import "./SuiviStock.css";

const REFRESH_MS = 30000;

const normalizeText = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function formatCalcul(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString("fr-FR")} · ${d.toLocaleTimeString("fr-FR")}`;
}

export default function SuiviStock() {
  const { t } = useTranslation();

  const [global, setGlobal] = useState(null);
  const [serviceView, setServiceView] = useState(null); // { id, name }
  const [serviceData, setServiceData] = useState(null); // { id, data }
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);

  const [search, setSearch] = useState("");
  const [modalFilter, setModalFilter] = useState(null);

  const serviceId = serviceView?.id ?? null;

  // Chargement : vue globale (toujours, pour le tableau des services) + vue service si sélectionnée
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
    return () => {
      cancelled = true;
    };
  }, [serviceId, tick]);

  // Mise à jour auto toutes les 30 s ; arrêtée en quittant la page (démontage)
  // et sautée tant que l'onglet du navigateur est masqué
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (!document.hidden) setTick((n) => n + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto]);

  const refresh = () => {
    setRefreshing(true);
    setTick((n) => n + 1);
  };

  const openService = (row) => {
    setServiceView({ id: row.key, name: row.label });
    setServiceData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToGlobal = () => {
    setServiceView(null);
    setServiceData(null);
  };

  const current = serviceView ? (serviceData?.id === serviceId ? serviceData.data : null) : global;

  const openLinges = (filter) =>
    setModalFilter({
      ...filter,
      serviceId: serviceView ? serviceView.id : undefined,
      serviceName: serviceView ? serviceView.name : undefined,
    });

  const categorieRows = useMemo(
    () =>
      (current?.parCategorie || []).map((c) => ({
        key: c.categorie,
        label: t(`categories.${c.categorie}`, c.categorie),
        color: accentOf(c.categorie),
        parZone: c.parZone,
        total: c.total,
      })),
    [current, t]
  );

  const serviceRows = useMemo(() => {
    const q = normalizeText(search.trim());
    return (global?.services || [])
      .filter((s) => !q || normalizeText(s.service).includes(q))
      .map((s) => ({
        key: s.serviceId,
        label: s.service || `${t("suiviStock.service")} ${s.serviceId}`,
        parZone: s.parZone,
        total: s.totalParc,
      }));
  }, [global, search, t]);

  /* ── États de chargement / erreur ────────────────────────────────────── */

  const firstLoad = !global && !error;
  const fatalError = !global && error;

  return (
    <div className="collecte-container sa-page ss-page">
      {/* 1. En-tête */}
      <header className="page-head ss-head">
        <div className="sa-header">
          <motion.div whileHover={{ rotate: -5, scale: 1.05 }} transition={{ duration: 0.3 }}>
            <PageHeaderIcon size={60} radius={20} />
          </motion.div>
          <div>
            <h1>{t("suiviStock.title")}</h1>
            <p>
              {t("suiviStock.last_calc")} : <strong style={{ color: "var(--sa-text-2)" }}>{formatCalcul(current?.dateCalcul ?? global?.dateCalcul)}</strong>
            </p>
          </div>
        </div>

        <div className="ss-head__actions">
          <span className={`ss-live ${auto ? "is-on" : ""}`}>
            <span className="ss-live__dot" />
            {auto ? t("suiviStock.auto_on") : t("suiviStock.auto_off")}
            <button type="button" onClick={() => setAuto((a) => !a)} title={auto ? t("suiviStock.pause") : t("suiviStock.resume")} aria-label={auto ? t("suiviStock.pause") : t("suiviStock.resume")}>
              {auto ? <Pause size={13} /> : <Play size={13} />}
            </button>
          </span>
          <button type="button" className="sa-btn sa-btn--primary" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> {t("suiviStock.refresh")}
          </button>
        </div>
      </header>

      {/* Échec d'une actualisation alors que des données sont déjà affichées */}
      {error && global && (
        <div className="sa-error ss-error" style={{ marginTop: 0 }}>
          <span>{t("suiviStock.refresh_failed")} — {error}</span>
          <button type="button" className="sa-btn sa-btn--sm" onClick={refresh}>
            <RefreshCw size={14} /> {t("suiviStock.retry")}
          </button>
        </div>
      )}

      {fatalError && (
        <Panel>
          <EmptyState art="empty" title={t("suiviStock.load_error")}>
            {error}
          </EmptyState>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <button type="button" className="sa-btn sa-btn--primary" onClick={refresh}>
              <RefreshCw size={16} /> {t("suiviStock.retry")}
            </button>
          </div>
        </Panel>
      )}

      {firstLoad && (
        <>
          <div className="ss-zones">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="sa-skeleton" style={{ height: 128 }} />)}
          </div>
          <div className="sa-skeleton" style={{ height: 110 }} />
          <div className="sa-skeleton" style={{ height: 260 }} />
        </>
      )}

      {global && (
        <>
          {/* Vue service : bandeau + retour */}
          {serviceView && (
            <motion.div className="ss-scope" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ss-scope__title">
                <span className="sa-chip__icon" style={{ width: 40, height: 40, borderRadius: 12 }}>
                  <Building2 size={20} />
                </span>
                <div>
                  <small>{t("suiviStock.service_view")}</small>
                  <strong>{serviceView.name}</strong>
                </div>
              </div>
              <button type="button" className="sa-btn" onClick={backToGlobal}>
                <ArrowLeft size={16} /> {t("suiviStock.back_global")}
              </button>
            </motion.div>
          )}

          {!current ? (
            <div className="ss-zones">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="sa-skeleton" style={{ height: 128 }} />)}
            </div>
          ) : current.totalParc === 0 ? (
            <Panel>
              <EmptyState title={t("suiviStock.empty")} />
            </Panel>
          ) : (
            <>
              {/* 2. Cartes par zone */}
              <ZoneCards parZone={current.parZone} totalParc={current.totalParc} onZoneClick={(zone) => openLinges({ zone })} />

              {/* 3. Répartition */}
              <Panel title={t("suiviStock.repartition")} icon={<BarChart3 size={17} />}>
                <RepartitionBar parZone={current.parZone} totalParc={current.totalParc} onZoneClick={(zone) => openLinges({ zone })} />
              </Panel>

              {/* 4. Par catégorie */}
              <Panel
                title={t("suiviStock.by_category")}
                icon={<Shirt size={17} />}
                right={<span className="sa-tag">{t("suiviStock.click_cell")}</span>}
              >
                {categorieRows.length === 0 ? (
                  <EmptyState title={t("suiviStock.empty")} />
                ) : (
                  <ZoneMatrix
                    rows={categorieRows}
                    firstColumn={t("suiviStock.category")}
                    onCellClick={(row, zone) => openLinges({ zone, categorie: row.key })}
                  />
                )}
              </Panel>
            </>
          )}

          {/* 5. Par service (toujours issu de la vue globale) */}
          <Panel
            title={t("suiviStock.by_service")}
            icon={<Building2 size={17} />}
            right={<span className="sa-tag">{t("suiviStock.services_count", { count: serviceRows.length })}</span>}
          >
            <div className="sa-search" style={{ marginBottom: 14, maxWidth: 420 }}>
              <Search size={17} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("suiviStock.search_service")}
                aria-label={t("suiviStock.search_service")}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label={t("common.reset")}>
                  <X size={15} />
                </button>
              )}
            </div>
            {serviceRows.length === 0 ? (
              <EmptyState title={search ? t("suiviStock.no_service_match") : t("suiviStock.no_services")} />
            ) : (
              <ZoneMatrix rows={serviceRows} firstColumn={t("suiviStock.service")} onRowClick={openService} maxHeight={520} />
            )}
          </Panel>
        </>
      )}

      {/* 6. Liste des linges */}
      {modalFilter && <LingesModal key={JSON.stringify(modalFilter)} filter={modalFilter} onClose={() => setModalFilter(null)} />}
    </div>
  );
}
