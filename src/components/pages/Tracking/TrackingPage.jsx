import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { AlertTriangle, QrCode, Radio, RefreshCw, Search, Shirt, Zap } from "lucide-react";
import { LingeContext } from "../../../contextes/LingeContext";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { getSetting, formatDateTime as formatDateTimeReglage } from "../../../utils/appSettings";
import { localiserLinge } from "../../../services/receptionArsenalService";
import {
  Page, ActionBar, ActionButton, Button, Modal, InfoList, DetailAlert,
} from "../../kit";
import { IconDetails } from "../../kit/ActionIcons";
import { useOperations } from "../../../hooks/useOperations";
import { ETAT_COULEURS } from "./stations";
import LiveBoard from "./LiveBoard";
import "./Tracking.css";

function formatDateTime(value) {
  if (!value) return null;
  const s = formatDateTimeReglage(value);
  return s === "—" ? null : s;
}

const DETAIL_FIELDS = [
  { key: "typeLinge", label: "Type de linge" },
  { key: "poids", label: "Poids", suffix: " kg" },
  { key: "client", label: "Client" },
  { key: "numeroLot", label: "Lot" },
  { key: "rfidTag", label: "Tag RFID" },
  { key: "chariot", label: "Chariot" },
  { key: "agentResponsable", label: "Agent en charge" },
  { key: "dateCollecte", label: "Date de collecte", isDate: true },
  { key: "dateLivraisonPrevue", label: "Livraison prévue", isDate: true },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function pickValue(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function resolveChambre(item, chambres) {
  const raw = item?.chambre ?? item?.Chambre;
  if (raw && typeof raw === "object") {
    return {
      code: pickValue(raw, ["code", "Code", "codeChambre", "numero", "nom"]),
      serviceId: pickValue(raw, ["serviceId", "ServiceId"]),
    };
  }
  const code = (typeof raw === "string" || typeof raw === "number") ? raw : pickValue(item, ["codeChambre", "chambreCode", "CodeChambre", "chambreNom", "numeroChambre"]);
  const id = pickValue(item, ["chambreId", "ChambreId", "idChambre"]);
  const found = id != null ? chambres.find((c) => String(c.id) === String(id)) : code != null ? chambres.find((c) => String(c.code) === String(code)) : null;
  if (!code && !found) return null;
  return { code: code ?? found?.code ?? `CH-${id}`, serviceId: found?.serviceId ?? null };
}

function resolveService(item, services, chambre) {
  const raw = item?.service ?? item?.Service;
  if (raw && typeof raw === "object") return pickValue(raw, ["code", "Code", "nom", "libelle", "designation"]);
  if (typeof raw === "string") return raw;
  const name = pickValue(item, ["serviceCode", "serviceNom", "serviceName", "nomService", "codeService"]);
  if (name) return name;
  const id = pickValue(item, ["serviceId", "ServiceId", "ServiceID", "idService"]) ?? chambre?.serviceId;
  if (id == null) return null;
  const s = (services || []).find((x) => String(x.id) === String(id));
  return s ? (s.code || s.nom || s.libelle) : null;
}

function EtatPill({ etat, t }) {
  return (
    <span className="kit-op-pill" style={{ "--op": ETAT_COULEURS[etat] || "#64748b" }}>
      <i />{t(`tracking.etat.${etat}`, etat)}
    </span>
  );
}

function infosLinge(item, chambre, serviceName, localisation, t) {
  const champs = DETAIL_FIELDS
    .map((f) => {
      const raw = item[f.key];
      if (raw === undefined || raw === null || raw === "") return null;
      const value = f.isDate ? formatDateTime(raw) : `${raw}${f.suffix || ""}`;
      return value ? { label: f.label, value } : null;
    })
    .filter(Boolean);

  const arsenal = !localisation
    ? [{ label: t("tracking.arsenal", "Arsenal"), value: "…" }]
    : localisation.data?.localise
      ? [
        { label: t("tracking.arsenal", "Arsenal"), value: localisation.data.arsenal || "—" },
        { label: t("tracking.emplacement", "Emplacement"), value: localisation.data.emplacement || "—" },
      ]
      : localisation.data
        ? [{ label: t("tracking.arsenal", "Arsenal"), value: localisation.data.message || t("tracking.not_in_arsenal", "Non rangé dans un arsenal") }]
        : [];

  return [
    { label: "Identifiant", value: `#${item.id}` },
    { label: t("tracking.service", "Service"), value: serviceName || "—" },
    { label: t("tracking.room", "Chambre"), value: chambre?.code || "—" },
    ...arsenal,
    ...champs,
  ];
}

function ItemDetailModal({ item, chambre, serviceName, localisation, onClose, t }) {
  if (!item) return null;
  return (
    <Modal
      size="md"
      icon={<Shirt size={20} />}
      title={item.codeBarre || "N/A"}
      subtitle={`${t("tracking.category") || "Catégorie"} · ${item.categorie || "—"}`}
      onClose={onClose}
      footer={<Button variant="secondary" onClick={onClose}>{t("common.close")}</Button>}
    >
      <div style={{ marginBottom: 14 }}><EtatPill etat={item.etat} t={t} /></div>
      <InfoList items={infosLinge(item, chambre, serviceName, localisation, t)} />
      <div className="trk-obs">
        <span>{t("tracking.observations", "Observations")}</span>
        <p className={item.observations ? "" : "is-empty"}>{item.observations || t("tracking.no_observation", "Aucune observation")}</p>
      </div>
    </Modal>
  );
}

export default function TrackingPage() {
  const { t, i18n } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [majA, setMajA] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [localisation, setLocalisation] = useState(null);
  const { getLingeByCode, getHistorique, isRfidMode } = useContext(LingeContext);
  const scanInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const location = useLocation();
  const lang = i18n.language || "fr";

  const { services } = useContext(ServiceContext);
  const [chambres, setChambres] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/chambres?tous=true`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setChambres(Array.isArray(data) ? data.map((c) => ({ id: c.cle ?? c.id, code: c.code, serviceId: c.serviceId })) : []);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error("Erreur chargement chambres:", err); });
    return () => controller.abort();
  }, []);

  const itemChambre = useMemo(() => (item ? resolveChambre(item, chambres) : null), [item, chambres]);
  const itemServiceName = useMemo(() => (item ? resolveService(item, services, itemChambre) : null), [item, services, itemChambre]);

  const performSearch = useCallback(async (code, silent = false) => {
    if (!silent) { setLoading(true); setError(""); setItem(null); setHistory([]); setLocalisation(null); }
    try {
      const foundItem = await getLingeByCode(code);
      if (foundItem) {
        setItem(foundItem);
        const codeLinge = foundItem.codeBarre || code;
        localiserLinge(codeLinge)
          .then((data) => setLocalisation({ code: codeLinge, data }))
          .catch(() => setLocalisation({ code: codeLinge, data: null }));
        const hist = await getHistorique(code);
        setHistory(hist || []);
        setMajA(Date.now());
      } else if (!silent) {
        setError(isRfidMode ? t('tracking.error_not_found_rfid') : t('tracking.error_not_found_barcode'));
      }
    } catch {
      if (!silent) setError(t('tracking.error_connection'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getHistorique, getLingeByCode, isRfidMode, t]);

  useEffect(() => {
    if (!autoRefresh || !item) return;
    const interval = setInterval(() => performSearch(item.codeBarre, true), (Number(getSetting("refresh.trackingSeconds")) || 10) * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, item, performSearch]);

  const handleReset = () => {
    setSearchValue(""); setItem(null); setHistory([]); setError(""); setLocalisation(null);
    setLoading(false); setMajA(null); setShowDetail(false);
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current && document.activeElement !== scanInputRef.current) {
        scanInputRef.current.focus(); setIsFocused(true);
      }
    };
    focusInput();
    const handleBodyClick = (e) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
      if (e.target.closest("button, input, select, a, [data-no-refocus]")) return;
      focusInput();
    };
    document.addEventListener("click", handleBodyClick);
    return () => document.removeEventListener("click", handleBodyClick);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (code) {
      const cleanCode = code.trim().replace(/\s/g, "").toUpperCase();
      setSearchValue(cleanCode);
      performSearch(cleanCode);
    }
  }, [location.search, performSearch]);

  useEffect(() => {
    if (searchValue.trim().length >= (Number(getSetting("scan.minLength")) || 3)) {
      const timer = setTimeout(() => performSearch(searchValue.trim()), Number(getSetting("scan.delayMs")) || 400);
      return () => clearTimeout(timer);
    }
  }, [searchValue, performSearch]);

  const { libelle: libelleOperation } = useOperations();

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = searchValue.trim().replace(/\s/g, "").toUpperCase();
    if (!cleanCode) return;
    performSearch(cleanCode);
  };

  const ScanIcon = isRfidMode ? Radio : QrCode;
  const loc = localisation?.code === item?.codeBarre ? localisation : null;

  return (
    <Page>
      <ActionBar>
        <ActionButton icon={IconDetails} label={t("common.details")} variant="details" disabled={!item} onClick={() => setShowDetail(true)} />
        <ActionButton
          icon={<Zap size={18} />}
          label={autoRefresh ? "LIVE" : "OFF"}
          variant={autoRefresh ? "etat-accepter" : "modifier"}
          onClick={() => setAutoRefresh(!autoRefresh)}
        />
        <ActionButton icon={<RefreshCw size={18} />} label={t("common.reset", "Réinitialiser")} variant="details" onClick={handleReset} />
      </ActionBar>

      <form onSubmit={handleSearch} style={{ margin: 0 }}>
        <div className={`kit-scan ${isFocused ? "is-ready" : ""}`}>
          <ScanIcon size={22} className="kit-scan__icon" />
          <input
            ref={scanInputRef}
            value={searchValue}
            placeholder={isRfidMode ? t("tracking.search_placeholder_rfid") : t("tracking.search_placeholder_barcode")}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label={isRfidMode ? t("tracking.search_placeholder_rfid") : t("tracking.search_placeholder_barcode")}
            autoComplete="off"
            autoFocus
          />
          <span className="kit-scan__status" role="status">
            {loading ? t("tracking.searching") : isFocused ? t("tracking.scan_ready") : t("tracking.waiting")}
          </span>
          <Button type="submit" disabled={loading || !searchValue.trim()} icon={<Search size={14} />}>{t("tracking.search_button")}</Button>
        </div>
      </form>

      {error && <div style={{ marginTop: 14 }}><DetailAlert icon={<AlertTriangle size={18} />} title={error} /></div>}

      <LiveBoard
        key={item?.id ?? "vide"}
        item={item}
        history={history}
        lang={lang}
        t={t}
        libelleOperation={libelleOperation}
        formatDateTime={formatDateTime}
        infos={item ? infosLinge(item, itemChambre, itemServiceName, loc, t) : []}
        live={autoRefresh}
        majA={majA}
        loading={loading}
        onDetails={() => setShowDetail(true)}
        EtatPill={EtatPill}
        ScanIcon={ScanIcon}
        emptyTitle={loading ? t("tracking.searching") : isRfidMode ? t("tracking.subtitle_rfid") : t("tracking.subtitle_barcode")}
        emptyText={isRfidMode ? t("tracking.empty_rfid") : t("tracking.empty_barcode")}
      />

      {showDetail && item && (
        <ItemDetailModal
          item={item}
          chambre={itemChambre}
          serviceName={itemServiceName}
          localisation={loc}
          onClose={() => setShowDetail(false)}
          t={t}
        />
      )}
    </Page>
  );
}
