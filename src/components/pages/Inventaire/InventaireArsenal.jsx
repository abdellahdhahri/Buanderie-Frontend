import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "../../kit/dialogueApi";
import printJS from "print-js";
import { Trash2, ScanLine, Printer, Eraser, BarChart3 } from "lucide-react";
import {
  Page, ActionBar, ActionButton, DataTable, Badge, DetailCard,
  RowActions, RowButton, Code, QuickStats,
} from "../../kit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const ETATS = {
  COLLECTE: "warning", EN_LAVAGE: "info", LAVE: "success", SECHE: "success", STOCKE: "secondary", SALE: "danger",
  PROPRE_PRET: "success", RECEPTIONNE: "success", DISTRIBUE: "success", EN_TRI: "info", PRET_LIVRAISON: "success",
};

const poidsDe = (linges = []) => linges.reduce((s, l) => s + (l.poids || 0), 0);

export default function InventaireArsenal() {
  const { t } = useTranslation();
  const [scanValue, setScanValue] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [arsenals, setArsenals] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => scanInputRef.current?.focus(), 300);
    const handleClick = (e) => {
      if (e.target.closest("button, input, select, a, textarea, .modal-overlay")) return;
      if (scanInputRef.current && document.activeElement !== scanInputRef.current) scanInputRef.current.focus();
    };
    document.addEventListener("click", handleClick);
    return () => { clearTimeout(id); document.removeEventListener("click", handleClick); };
  }, []);

  const fetchLinges = useCallback(async (arsenalId) => {
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/arsenals/${arsenalId}/linges`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : data?.content || [];
    } catch {
      return [];
    }
  }, []);

  const alerte = (title, text, icon = "error", timer = 1500) => Swal.fire({ title, text, icon, timer, showConfirmButton: false });

  const fetchArsenal = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/code/${code}?code=${code}`);
      if (!response.ok) {
        if (response.status === 404) alerte(t("inventaire.not_found"), t("inventaire.not_found_text", { code }));
        else alerte(t("inventaire.error"), t("inventaire.error_status", { status: response.status, message: response.statusText }));
        return;
      }
      const data = await response.json();
      if (!data?.id) {
        alerte(t("inventaire.invalid_data"), t("inventaire.invalid_data_text"));
        return;
      }
      const linges = await fetchLinges(data.id);
      const existe = arsenals.some((a) => a.id === data.id);
      setArsenals((prev) => (existe ? prev.map((a) => (a.id === data.id ? { ...data, linges } : a)) : [{ ...data, linges }, ...prev]));
      setExpandedId(data.id);
      const params = { name: data.nom, code: data.code, count: linges.length };
      if (existe) alerte(t("inventaire.arsenal_updated"), t("inventaire.arsenal_updated_text", params), "info", 1200);
      else alerte(t("inventaire.arsenal_added"), t("inventaire.arsenal_added_text", params), "success", 1200);
    } catch (err) {
      console.error("Erreur fetchArsenal:", err);
      alerte(t("inventaire.network_error"), t("inventaire.network_error_text"));
    } finally {
      setScanValue("");
      setIsLoading(false);
    }
  }, [arsenals, fetchLinges, t]);

  useEffect(() => {
    clearTimeout(scanTimeoutRef.current);
    const code = scanValue.trim().toUpperCase();
    if (code.length >= 3 && !isLoading) scanTimeoutRef.current = setTimeout(() => fetchArsenal(code), 400);
    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanValue]);

  const removeArsenal = async (id) => {
    const res = await Swal.fire({
      title: t("inventaire.delete_arsenal_title"),
      text: t("inventaire.delete_arsenal_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("inventaire.delete_confirm"),
      cancelButtonText: t("inventaire.delete_cancel"),
    });
    if (!res.isConfirmed) return;
    setArsenals((prev) => prev.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const clearAll = async () => {
    if (!arsenals.length) return;
    const res = await Swal.fire({
      title: t("inventaire.clear_all_title"),
      text: t("inventaire.clear_all_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("inventaire.clear_all_confirm"),
      cancelButtonText: t("inventaire.clear_all_cancel"),
    });
    if (!res.isConfirmed) return;
    setArsenals([]);
    setExpandedId(null);
  };

  const totalLinges = arsenals.reduce((n, a) => n + (a.linges?.length || 0), 0);
  const totalPoids = arsenals.reduce((n, a) => n + poidsDe(a.linges), 0);

  const imprimer = () => {
    if (!arsenals.length) {
      alerte(t("inventaire.no_data_print"), t("inventaire.no_data_print_text"), "warning");
      return;
    }
    const blocs = arsenals.map((arsenal) => {
      const linges = arsenal.linges || [];
      const details = linges.length
        ? `<div style="font-size:6pt; margin-top:1mm; border-top:1px solid #eee; padding-top:1mm;">
            ${linges.slice(0, 10).map((l) => `<div style="display:flex; justify-content:space-between; padding:1px 0;"><span>${l.codeBarre || "N/A"}</span><span>${l.categorie || t("inventaire.uncategorized")}</span></div>`).join("")}
            ${linges.length > 10 ? `<div style="text-align:center; color:#666;">${t("inventaire.print_and_others", { count: linges.length - 10 })}</div>` : ""}
          </div>`
        : `<div style="font-size:6pt; color:#999; margin-top:1mm;">${t("inventaire.print_no_linge")}</div>`;
      return `
        <div style="margin-bottom:3mm; border:1px solid #ddd; padding:2mm; border-radius:4px;">
          <div style="font-weight:bold; font-size:10pt;">${arsenal.code}</div>
          <div style="font-size:7pt; color:#666;">${arsenal.nom}</div>
          <div style="display:flex; justify-content:space-between; font-size:7pt; margin-top:1mm;">
            <span>${linges.length} ${t("inventaire.linens_count")}</span><span>${poidsDe(linges).toFixed(1)} ${t("inventaire.weight_unit")}</span>
          </div>
          ${details}
        </div>`;
    }).join("");
    printJS({
      printable: `
        <div style="width:80mm; padding:5mm; font-family:'Courier New',monospace; background:white;">
          <div style="text-align:center; border-bottom:2px solid black; padding-bottom:3mm; margin-bottom:3mm;">
            <h2 style="margin:0; font-size:14pt;">${t("inventaire.print_title")}</h2>
            <p style="margin:2px 0; font-size:8pt; color:#666;">${new Date().toLocaleString("fr-FR")}</p>
          </div>
          <div style="margin-bottom:3mm; padding:2mm; background:#f0fdf4; border:1px solid #86efac; border-radius:4px; text-align:center;">
            <div style="font-size:10pt; font-weight:bold; color:#166534;">${t("inventaire.print_total")}: ${totalLinges}</div>
          </div>
          ${blocs}
          <div style="text-align:center; font-size:6pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm; color:#666;">${new Date().toLocaleString("fr-FR")}</div>
        </div>`,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: "Inventaire_Arsenals",
      css: "@page { size: 80mm auto; margin: 0; }",
    });
  };

  const ouvert = arsenals.find((a) => a.id === expandedId);

  const ARSENAL_COLUMNS = {
    code: { label: t("arsenal.code", "Code"), render: (a) => <Code>{a.code}</Code> },
    nom: { label: t("arsenal.name", "Nom"), render: (a) => <strong>{a.nom}</strong> },
    service: { label: t("inventaire.service"), render: (a) => (a.serviceId ? <Badge variant="info">{a.serviceId}</Badge> : <Badge variant="secondary">{t("inventaire.unassigned")}</Badge>) },
    linges: { label: t("inventaire.linens_count"), align: "center", render: (a) => <Badge variant="info">{a.linges?.length || 0}</Badge> },
    poids: { label: t("inventaire.weight_unit"), align: "right", render: (a) => `${poidsDe(a.linges).toFixed(1)} ${t("inventaire.weight_unit")}` },
    actions: {
      label: t("common.actions"), align: "center",
      render: (a) => <RowActions><RowButton icon={Trash2} tone="danger" title={t("common.delete")} onClick={() => removeArsenal(a.id)} /></RowActions>,
    },
  };

  const LINGE_COLUMNS = {
    codeBarre: { label: t("arsenal.tracking_code", "Code"), render: (l) => <Code>{l.codeBarre || "N/A"}</Code> },
    categorie: { label: t("common.category"), render: (l) => l.categorie || t("inventaire.uncategorized") },
    etat: { label: t("common.status"), render: (l) => <Badge variant={ETATS[l.etat] || "secondary"}>{l.etat ? t(`linge_etat.${l.etat}`, l.etat) : "—"}</Badge> },
    poids: { label: t("inventaire.weight_unit"), align: "right", render: (l) => `${l.poids || 0} ${t("inventaire.weight_unit")}` },
    rfidTag: { label: "RFID", render: (l) => (l.rfidTag ? <Code>{l.rfidTag}</Code> : "—") },
  };

  const parCategorie = Object.entries(arsenals.flatMap((a) => a.linges || []).reduce((acc, l) => {
    const k = l.categorie || t("inventaire.uncategorized");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  return (
    <Page>
      <ActionBar>
        <ActionButton icon={Printer} label={t("inventaire.print_title")} variant="imprimer" disabled={!arsenals.length} onClick={imprimer} />
        <ActionButton icon={Eraser} label={t("inventaire.clear_all_title")} variant="supprimer" disabled={!arsenals.length} onClick={clearAll} />
        <ActionButton icon={<BarChart3 size={18} />} label={t("kit.stats", "Statistiques")} variant="rapport-global" disabled={!arsenals.length} onClick={() => setShowStats(true)} />
      </ActionBar>

      <div className={`kit-scan ${isFocused ? "is-ready" : ""}`}>
        <ScanLine size={22} className="kit-scan__icon" />
        <input
          ref={scanInputRef}
          value={scanValue}
          placeholder={t("inventaire.scan_placeholder")}
          onChange={(e) => setScanValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          autoComplete="off"
        />
        <span className="kit-scan__status">
          {isLoading ? t("common.loading") : isFocused ? t("inventaire.scan_ready") : t("inventaire.scan_inactive")}
        </span>
      </div>
      <p className="kit-muted" style={{ fontSize: ".78rem", margin: "6px 4px 16px" }}>
        {t("inventaire.scan_auto")} · {t("inventaire.scan_delay")}
      </p>

      <div className="employee-list-section">
        <DataTable
          columns={ARSENAL_COLUMNS}
          rows={arsenals}
          activeId={expandedId}
          onRowClick={(a) => setExpandedId(expandedId === a.id ? null : a.id)}
          emptyText={t("inventaire.no_data_text")}
        />
      </div>

      {ouvert && (
        <div style={{ marginTop: 16 }}>
          <DetailCard title={`${ouvert.code} · ${ouvert.nom} — ${ouvert.linges?.length || 0} ${t("inventaire.linens_count")}`}>
            <DataTable columns={LINGE_COLUMNS} rows={ouvert.linges || []} emptyText={t("inventaire.print_no_linge")} />
          </DetailCard>
        </div>
      )}

      {showStats && (
        <QuickStats
          title={t("inventaire.title")}
          subtitle={`${arsenals.length} arsenal(aux)`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: "Arsenaux", value: arsenals.length },
            { label: t("inventaire.linens_count"), value: totalLinges, color: "#3b82f6" },
            { label: t("inventaire.weight_unit"), value: totalPoids.toFixed(1), color: "#f59e0b" },
          ]}
          repartitions={[{ title: t("common.category"), items: parCategorie }]}
          classements={[{ title: "Arsenaux", items: arsenals.map((a) => ({ label: `${a.code} · ${a.nom}`, value: a.linges?.length || 0 })).sort((a, b) => b.value - a.value) }]}
        />
      )}
    </Page>
  );
}
