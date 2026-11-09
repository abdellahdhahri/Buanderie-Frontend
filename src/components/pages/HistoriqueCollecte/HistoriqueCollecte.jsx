import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { RefreshCw, Eye, Copy, Check, Printer } from "lucide-react";
import { ServiceContext } from "../../../contextes/ServiceContext";
import { PageHeaderIcon } from "../../Layout/PageHeaderIcon";
import { getSetting, formatDateTime } from "../../../utils/appSettings";
import { useCircuitInfecte } from "../../../hooks/useEstablishment";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { C, Glyph, tint, dot, useRelativeTime } from "../../ui/history-kit";
import {
  fetchCollectes,
  fetchCollecteDetails,
  fetchPersonnelsByIds,
} from "../../../services/historiqueCollecteService";
import {
  Page, PageHeader, ActionBar, ActionButton,
  FilterPanel, FilterRow, FilterSelect, FilterText, FilterColumnSelect, FilterDateRange, FilterActions,
  ListSection, DataTable, Pagination, PersonName,
  DetailsPage, DetailsButton, DetailCard, DetailGrid, InfoList, DetailText, DetailAlert, Timeline,
  ColumnSettingsModal, useListPage, useRowSelection, exportExcel,
  Tabs, RowActions, RowButton, Code, QuickStats, day, tk,
} from "../../kit";
import { IconDetails } from "../../kit/ActionIcons";

const IconRoom = (p) => (
  <Glyph {...p}>
    <path d="M3 5v14M21 19v-6.5a3 3 0 0 0-3-3h-7.5V14" />
    <path d="M3 14h18v3H3Z" {...tint} />
    <rect x="5" y="9.5" width="4" height="3" rx="1.5" {...tint} />
  </Glyph>
);
const IconService = (p) => (
  <Glyph {...p}>
    <path d="M4 21V8.5A1.5 1.5 0 0 1 5.5 7H9V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7h3.5A1.5 1.5 0 0 1 20 8.5V21" {...tint} />
    <path d="M2.5 21h19M12 9.5v4M10 11.5h4M10 21v-3.5h4V21" />
  </Glyph>
);
const IconUniform = (p) => (
  <Glyph {...p}>
    <path d="M8 3 4 5.5 2.5 10l3 1.2V21h13V11.2l3-1.2L20 5.5 16 3c-.6 1.6-2.2 2.6-4 2.6S8.6 4.6 8 3Z" {...tint} />
    <path d="M12 5.6V21M15 13h2" />
  </Glyph>
);
const IconBundle = (p) => (
  <Glyph {...p}>
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" {...tint} />
    <path d="M4 8.5 12 13l8-4.5M12 13v7" />
  </Glyph>
);
const IconCollect = (p) => (
  <Glyph {...p}>
    <path d="M5 9h14l-1.3 10.2A2 2 0 0 1 15.7 21H8.3a2 2 0 0 1-2-1.8z" {...tint} />
    <path d="M3.5 9h17M9 9V6.5a3 3 0 0 1 6 0V9" />
  </Glyph>
);
const IconStack = (p) => (
  <Glyph {...p}>
    <path d="M3 7.5 12 3l9 4.5-9 4.5z" {...tint} />
    <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
  </Glyph>
);
const IconGauge = (p) => (
  <Glyph {...p}>
    <path d="M3.5 16a8.5 8.5 0 1 1 17 0" {...tint} />
    <path d="M12 16l4-5" />
    <circle cx="12" cy="16" r="1.4" {...dot} />
    <path d="M3.5 16h2M18.5 16h2M12 7.5v1.5" />
  </Glyph>
);
const IconAlert = (p) => (
  <Glyph {...p}>
    <path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" {...tint} />
    <path d="M12 9.5v4" />
    <circle cx="12" cy="16.8" r=".9" {...dot} />
  </Glyph>
);
const IconClock = (p) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="9" {...tint} />
    <path d="M12 7.5V12l3 2" />
  </Glyph>
);

const SOURCES = {
  CH:  { id: "CH",  color: C.teal,   Icon: IconRoom,    key: "source_room",    fb: "Chambre" },
  SVC: { id: "SVC", color: C.sky,    Icon: IconService, key: "source_service", fb: "Service" },
  UNI: { id: "UNI", color: C.violet, Icon: IconUniform, key: "source_uniform", fb: "Uniformes" },
  COL: { id: "COL", color: C.orange, Icon: IconBundle,  key: "source_linen",   fb: "Linge de service" },
  AUTRE: { id: "AUTRE", color: C.slate, Icon: IconCollect, key: "source_other", fb: "Collecte" },
};
const getSource = (c) => SOURCES[(c.numeroCollecte || "").split("-")[0].toUpperCase()] || SOURCES.AUTRE;

function getCounts(c) {
  const n = (v) => Number(v) || 0;
  const blanc = n(c["nbScannésBlanc"] ?? c.nbScannesBlanc);
  const infectes = n(c["nbInfectésPrésumés"] ?? c.nbInfectesPresumes);
  const propres = n(c.nbPropres);
  const manquants = n(c.nbManquants);
  const attendus = n(c.nbAttendus);
  const traites = blanc + infectes + propres + manquants;
  const pct = attendus > 0 ? Math.min(100, Math.round((traites / attendus) * 100)) : traites > 0 ? 100 : 0;
  return { blanc, infectes, propres, manquants, attendus, traites, pct };
}

const ETATS = {
  EN_TRAITEMENT: { color: C.amber, key: "etat_running", fb: "En cours", pulse: true },
  VERIFIE:       { color: C.green, key: "etats.VERIFIE", fb: "Vérifiée" },
  CLOTUREE:      { color: C.teal,  key: "etats.CLOTUREE", fb: "Clôturée" },
};
const normEtat = (e) => String(e || "").toUpperCase();
const etatLabel = (etat, t) => {
  const e = ETATS[normEtat(etat)];
  return e ? t(`historique_collecte.${e.key}`, e.fb) : etat || "—";
};
const isDone = (c) => ["VERIFIE", "CLOTUREE"].includes(normEtat(c.etatCollecte));

function parseExpected(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function durationMinutes(c) {
  const start = c.dateDebut || c.dateCollecte;
  if (!start || !c.dateFin) return null;
  const m = Math.round((new Date(c.dateFin) - new Date(start)) / 60000);
  return m >= 0 ? m : null;
}

function extractPersonnelName(p) {
  if (!p) return null;
  if (p.nomPrenom) return p.nomPrenom;
  if (p.nom_prenom) return p.nom_prenom;
  if (p.nomComplet) return p.nomComplet;
  if (p.fullName) return p.fullName;
  const nom = p.nom || p.lastName || "";
  const prenom = p.prenom || p.firstName || "";
  if (nom || prenom) return `${nom} ${prenom}`.trim();
  return p.matricule || p.code || null;
}

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function SourceTile({ source, size = 36 }) {
  const { Icon, color } = source;
  return <span className="kit-zone-icon" style={{ "--z": color, width: size, height: size }}><Icon size={Math.round(size * 0.5)} /></span>;
}

function EtatPill({ etat, t }) {
  const e = ETATS[normEtat(etat)];
  return (
    <span className={`kit-op-pill ${e?.pulse ? "is-live" : ""}`} style={{ "--op": e?.color || C.slate }}>
      <i />{etatLabel(etat, t)}
    </span>
  );
}

const SEGMENTS = [
  { k: "blanc", color: C.green, key: "white_collected", fb: "Blanc" },
  { k: "propres", color: C.sky, key: "clean_in_place", fb: "Propre en place" },
  { k: "infectes", color: C.red, key: "infected", fb: "Infecté" },
  { k: "manquants", color: C.amber, key: "missing", fb: "Manquant" },
];

function StackedBar({ counts, height = 8 }) {
  const base = Math.max(counts.attendus, counts.traites, 1);
  return (
    <div className="kit-stack" style={{ height }}>
      {SEGMENTS.map((s) => counts[s.k] > 0 && (
        <motion.span
          key={s.k}
          initial={{ width: 0 }}
          animate={{ width: `${(counts[s.k] / base) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: s.color }}
        />
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 112, color = C.teal }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="kit-ring">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="9" />
      <motion.circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        transform="rotate(-90 50 50)" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="currentColor" style={{ fontSize: 22, fontWeight: 800 }}>{pct}%</text>
    </svg>
  );
}

function DetailCollecte({ collecte, resume, resumeLoading, onBack, agentName, serviceName, t, relative }) {
  const [copied, setCopied] = useState(false);
  const circuitInfecte = useCircuitInfecte();
  const source = getSource(collecte);
  const counts = getCounts(collecte);
  const expected = parseExpected(collecte.quantitesAttendues);
  const duration = durationMinutes(collecte);
  const done = isDone(collecte);

  const catMap = {};
  (resume?.categories || []).forEach((c) => { catMap[c.categorie] = { collected: Number(c.quantite) || 0, expected: 0 }; });
  Object.entries(expected).forEach(([cat, q]) => { catMap[cat] = { collected: catMap[cat]?.collected || 0, expected: Number(q) || 0 }; });
  const categories = Object.entries(catMap).sort((a, b) => b[1].collected - a[1].collected);
  const totalPieces = resume?.totalPieces ?? categories.reduce((s, [, v]) => s + v.collected, 0);
  const catMax = Math.max(1, ...categories.map(([, v]) => Math.max(v.collected, v.expected)));
  const location = source.id === "CH" && collecte.codeChambre ? `${t("historique_collecte.room", "Chambre")} ${collecte.codeChambre}` : serviceName;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(collecte.numeroCollecte || String(collecte.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("Copie impossible :", err);
    }
  };

  const printReport = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    const rows = SEGMENTS.map((s) => `<tr><td><span class="dot" style="background:${s.color}"></span>${escapeHtml(t(`historique_collecte.${s.key}`, s.fb))}</td><td class="num">${counts[s.k]}</td></tr>`).join("");
    const catRows = categories.map(([cat, v]) => `<tr><td>${escapeHtml(t(`categories.${cat}`, cat))}</td><td class="num">${v.collected}</td><td class="num">${v.expected || "—"}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(collecte.numeroCollecte || collecte.id)}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:32px;font-size:13px}
        h1{font-size:20px;margin:0} .muted{color:#64748b} .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0d9488;padding-bottom:12px;margin-bottom:20px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:20px} .grid div{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}
        h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#0d9488;margin:22px 0 8px}
        table{width:100%;border-collapse:collapse} td,th{padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:left} th{font-size:11px;text-transform:uppercase;color:#64748b}
        .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600} .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px}
        .total td{font-weight:800;border-top:2px solid #0f172a} .foot{margin-top:40px;display:flex;justify-content:space-between;color:#64748b;font-size:11px}
        .sign{margin-top:48px;display:flex;justify-content:space-between} .sign div{width:40%;border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;font-size:11px}
      </style></head><body>
      <div class="head"><div><div class="muted">${escapeHtml(t("historique_collecte.report_title", "Rapport de collecte"))}</div><h1>${escapeHtml(collecte.numeroCollecte || "#" + collecte.id)}</h1></div>
      <div class="muted">${escapeHtml(t(`historique_collecte.${source.key}`, source.fb))} · ${escapeHtml(formatDateTime(collecte.dateCollecte))}</div></div>
      <div class="grid">
        <div><span class="muted">${escapeHtml(t("historique_collecte.agent", "Agent"))}</span><b>${escapeHtml(agentName)}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.location", "Lieu"))}</span><b>${escapeHtml(location)}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.status", "État"))}</span><b>${escapeHtml(etatLabel(collecte.etatCollecte, t))}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.duration", "Durée"))}</span><b>${duration != null ? duration + " " + escapeHtml(t("historique_collecte.min", "min")) : "—"}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.ended_at", "Terminée le"))}</span><b>${escapeHtml(formatDateTime(collecte.dateFin))}</b></div>
        <div><span class="muted">${escapeHtml(t("historique_collecte.completion", "Complétude"))}</span><b>${counts.traites} / ${counts.attendus} (${counts.pct}%)</b></div>
      </div>
      <h2>${escapeHtml(t("historique_collecte.outcome", "Résultat"))}</h2>
      <table>${rows}<tr class="total"><td>${escapeHtml(t("historique_collecte.processed", "Traitées"))}</td><td class="num">${counts.traites}</td></tr></table>
      ${categories.length ? `<h2>${escapeHtml(t("historique_collecte.categories", "Catégories"))}</h2><table><tr><th>${escapeHtml(t("historique_collecte.category", "Catégorie"))}</th><th class="num">${escapeHtml(t("historique_collecte.collected", "Collecté"))}</th><th class="num">${escapeHtml(t("historique_collecte.expected", "Attendu"))}</th></tr>${catRows}<tr class="total"><td>${escapeHtml(t("historique_collecte.total_pieces", "Total pièces"))}</td><td class="num">${totalPieces}</td><td></td></tr></table>` : ""}
      <div class="sign"><div>${escapeHtml(t("historique_collecte.sign_agent", "Signature de l'agent"))}</div><div>${escapeHtml(t("historique_collecte.sign_manager", "Visa du responsable"))}</div></div>
      <div class="foot"><span>ID ${collecte.id}</span><span>${escapeHtml(t("historique_collecte.printed_on", "Imprimé le"))} ${escapeHtml(formatDateTime(new Date()))}</span></div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  return (
    <DetailsPage
      onBack={onBack}
      eyebrow={t(`historique_collecte.${source.key}`, source.fb)}
      title={collecte.numeroCollecte || `#${collecte.id}`}
      badge={<EtatPill etat={collecte.etatCollecte} t={t} />}
      actions={(
        <>
          <DetailsButton icon={copied ? Check : Copy} onClick={copy}>{t("common.copy", "Copier")}</DetailsButton>
          <DetailsButton icon={Printer} onClick={printReport}>{t("historique_collecte.print_report", "Imprimer le rapport")}</DetailsButton>
        </>
      )}
    >
      <div className="kit-hero" style={{ "--z": source.color }}>
        <span className="kit-hero__icon"><source.Icon size={30} /></span>
        <div>
          <small>{formatDateTime(collecte.dateCollecte)} · {relative(collecte.dateCollecte)}</small>
          <strong>{location}</strong>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <PersonName name={agentName} strong={false} />
            {duration != null && <span className="kit-chip"><IconClock size={13} /> {duration} {t("historique_collecte.min", "min")}</span>}
          </span>
        </div>
      </div>

      <DetailGrid>
        <DetailCard title={t("historique_collecte.outcome", "Résultat")}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <ProgressRing pct={counts.pct} color={counts.pct >= 100 ? C.green : source.color} size={110} />
              <small className="kit-muted" style={{ display: "block", fontWeight: 700 }}>
                {counts.traites} / {counts.attendus || "—"} {t("historique_collecte.processed_short", "traitées")}
              </small>
            </div>
            <div className="kit-seg-grid">
              {SEGMENTS.filter((s) => circuitInfecte || s.k !== "infectes").map((s) => (
                <div key={s.k} className="kit-seg" style={{ "--z": s.color }}>
                  <span><i />{t(`historique_collecte.${s.key}`, s.fb)}</span>
                  <strong>{counts[s.k]}</strong>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}><StackedBar counts={counts} height={10} /></div>
          {(counts.infectes > 0 || counts.manquants > 0) && (
            <div style={{ marginTop: 12 }}>
              <DetailAlert icon={<IconAlert size={18} />}>
                <p>
                  {counts.infectes > 0 && t("historique_collecte.alert_infected", "{{count}} pièce(s) infectée(s) présumée(s)", { count: counts.infectes })}
                  {counts.infectes > 0 && counts.manquants > 0 && " · "}
                  {counts.manquants > 0 && t("historique_collecte.alert_missing", "{{count}} pièce(s) manquante(s)", { count: counts.manquants })}
                </p>
              </DetailAlert>
            </div>
          )}
        </DetailCard>

        <DetailCard title={`${t("historique_collecte.categories", "Catégories")}${resumeLoading ? "" : ` · ${totalPieces} ${t("historique_collecte.pieces", "pièce(s)")}`}`}>
          {resumeLoading ? (
            <p className="kit-muted">{t("common.loading")}</p>
          ) : categories.length === 0 ? (
            <DetailText empty={t("historique_collecte.no_categories", "Aucune pièce enregistrée pour cette collecte.")} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {categories.map(([cat, v], i) => {
                const { Icon, accent } = getCategorieMeta(cat);
                const atteint = v.expected > 0 && v.collected >= v.expected;
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="kit-zone-icon" style={{ "--z": accent }}><Icon size={15} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".84rem" }}>
                        <span style={{ fontWeight: 700 }}>{t(`categories.${cat}`, cat)}</span>
                        <span><strong>{v.collected}</strong>{v.expected > 0 && <span className="kit-muted"> / {v.expected}</span>}</span>
                      </div>
                      <div className="kit-gauge" style={{ position: "relative" }}>
                        {v.expected > 0 && <span style={{ position: "absolute", inset: 0, width: `${(v.expected / catMax) * 100}%`, background: `${accent}26` }} />}
                        <motion.span
                          style={{ position: "relative", background: atteint ? C.green : accent }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(v.collected / catMax) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(expected).length > 0 && <small className="kit-muted">{t("historique_collecte.expected_hint", "Partie claire de la barre : quantité attendue.")}</small>}
            </div>
          )}
        </DetailCard>
      </DetailGrid>

      <DetailGrid>
        <DetailCard title={t("historique_collecte.timeline", "Chronologie")}>
          <Timeline steps={[
            { key: "open", title: t("historique_collecte.opened", "Ouverte"), date: `${formatDateTime(collecte.dateDebut || collecte.dateCollecte)} · ${relative(collecte.dateDebut || collecte.dateCollecte)}`, status: "done" },
            done || collecte.dateFin
              ? { key: "end", title: t("historique_collecte.ended", "Terminée"), date: `${formatDateTime(collecte.dateFin)} · ${relative(collecte.dateFin)}`, status: "success" }
              : { key: "run", title: t("historique_collecte.in_progress", "En cours de collecte"), date: t("historique_collecte.not_finished", "Pas encore terminée"), status: "current" },
          ]} />
        </DetailCard>
        <DetailCard title={t("historique_collecte.information", "Informations")}>
          <InfoList items={[
            { label: t("historique_collecte.collection_number", "Numéro"), value: <Code>{collecte.numeroCollecte}</Code> },
            { label: t("historique_collecte.collection_id", "ID"), value: collecte.id },
            { label: t("historique_collecte.agent", "Agent"), value: agentName },
            { label: t("historique_collecte.service", "Service"), value: serviceName },
            ...(collecte.codeChambre ? [{ label: t("historique_collecte.room", "Chambre"), value: collecte.codeChambre }] : []),
            ...(collecte.litIdSqlServer ? [{ label: t("historique_collecte.bed", "Lit"), value: `#${collecte.litIdSqlServer}` }] : []),
            { label: t("historique_collecte.created_at", "Créée le"), value: formatDateTime(collecte.dateCollecte) },
          ]} />
        </DetailCard>
      </DetailGrid>
    </DetailsPage>
  );
}

const COLUMNS_DEFAULT = [
  { key: "numero", label: "Collecte", visible: true, searchable: true },
  { key: "date", label: "Date", visible: true, searchable: true },
  { key: "location", label: "Lieu", visible: true, searchable: true },
  { key: "agent", label: "Agent", visible: true, searchable: true },
  { key: "progress", label: "Avancement", visible: true, searchable: false },
  { key: "etat", label: "État", visible: true, searchable: true },
  { key: "actions", label: "Actions", visible: true, searchable: false },
];

export default function HistoriqueCollecte() {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();
  const relative = useRelativeTime();
  const { services = [] } = useContext(ServiceContext) || {};
  const pageSize = Number(getSetting("display.pageSize")) || 10;

  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personnels, setPersonnels] = useState({});
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [resumes, setResumes] = useState({});
  const [resumeLoading, setResumeLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const loadCollectes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCollectes();
      const liste = Array.isArray(data) ? data : [];
      setCollectes(liste);
      const ids = [...new Set(liste.map((c) => c.personnelId).filter((id) => id != null))];
      if (ids.length) {
        const map = await fetchPersonnelsByIds(ids);
        const cache = {};
        Object.entries(map || {}).forEach(([id, p]) => { cache[id] = extractPersonnelName(p) || `#${id}`; });
        setPersonnels(cache);
      }
    } catch (error) {
      console.error("Erreur chargement collectes:", error);
      setCollectes([]);
      Swal.fire({ icon: "error", title: t("common.error"), text: error.message || t("historique_collecte.load_error"), timer: 3000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadCollectes(); }, [loadCollectes]);

  const openDetails = useCallback(async (c) => {
    if (!c) return;
    setSelected(c);
    setViewMode("details");
    if (resumes[c.id]) return;
    setResumeLoading(true);
    try {
      const data = await fetchCollecteDetails(c.id);
      setResumes((prev) => ({ ...prev, [c.id]: data }));
    } catch (err) {
      console.error("Erreur chargement détails:", err);
    } finally {
      setResumeLoading(false);
    }
  }, [resumes]);

  const agentDe = useCallback((id) => (id == null ? t("historique_collecte.unknown_agent", "Agent non renseigné") : personnels[id] || `#${id}`), [personnels, t]);
  const serviceDe = useCallback((serviceId) => {
    if (!serviceId) return t("historique_collecte.unassigned");
    const s = services.find((x) => x.id === serviceId);
    return s ? (s.nom || s.libelle || s.code) : `#${serviceId}`;
  }, [services, t]);
  const lieuDe = (c) => (getSource(c).id === "CH" && c.codeChambre ? `${t("historique_collecte.room", "Chambre")} ${c.codeChambre}` : serviceDe(c.service));

  const columns = useMemo(() => COLUMNS_DEFAULT.map((c) => ({
    ...c,
    label: {
      numero: t("historique_collecte.collection", "Collecte"), date: t("historique_collecte.date", "Date"),
      location: t("historique_collecte.location", "Lieu"), agent: t("historique_collecte.agent", "Agent"),
      progress: t("historique_collecte.progress", "Avancement"), etat: t("historique_collecte.status", "État"), actions: t("common.actions"),
    }[c.key] || c.label,
  })), [t]);

  const searchValue = (c, key) => {
    switch (key) {
      case "numero": return `${c.numeroCollecte || ""} ${c.id}`;
      case "date": return formatDateTime(c.dateCollecte);
      case "location": return lieuDe(c);
      case "agent": return agentDe(c.personnelId);
      case "progress": return `${getCounts(c).pct}%`;
      case "etat": return etatLabel(c.etatCollecte, t);
      default: return "";
    }
  };
  const sortValue = (c, key) => {
    if (key === "date") return new Date(c.dateCollecte || 0).getTime();
    if (key === "progress") return getCounts(c).pct;
    return String(searchValue(c, key)).toLowerCase();
  };

  const rows = useMemo(() => (source ? collectes.filter((c) => getSource(c).id === source) : collectes), [collectes, source]);

  const list = useListPage({
    rows,
    columns,
    getSearchValue: searchValue,
    getSortValue: sortValue,
    pageSize,
    defaultSort: (a, b) => new Date(b.dateCollecte) - new Date(a.dateCollecte),
    filters: {
      etat: { initial: "all", column: "etat", test: (c, v) => v === "all" || normEtat(c.etatCollecte) === v },
      dateFrom: { initial: "", column: "date", test: (c, v) => !v || day(c.dateCollecte) >= v },
      dateTo: { initial: "", column: "date", test: (c, v) => !v || day(c.dateCollecte) <= v },
    },
  });
  const { draft, setFilter } = list;
  const sel = useRowSelection(list.sorted);

  const handleExportExcel = (lignes) => {
    const src = Array.isArray(lignes) ? lignes : list.sorted;
    if (!src.length) return;
    exportExcel({
      fileName: "historique_collectes",
      sheetName: t("historique_collecte.title", "Collectes"),
      columns: list.visibleColumns.filter((c) => c.key !== "actions"),
      rows: src,
      getValue: searchValue,
    });
  };

  const TABLE_COLUMNS = {
    numero: {
      label: t("historique_collecte.collection", "Collecte"), sortable: true,
      render: (c) => {
        const s = getSource(c);
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <SourceTile source={s} />
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <Code>{c.numeroCollecte || `#${c.id}`}</Code>
              <small className="kit-muted">{t(`historique_collecte.${s.key}`, s.fb)}</small>
            </span>
          </span>
        );
      },
    },
    date: {
      label: t("historique_collecte.date", "Date"), sortable: true,
      render: (c) => <div className="kit-datetime"><strong>{formatDateTime(c.dateCollecte)}</strong><small>{relative(c.dateCollecte)}</small></div>,
    },
    location: { label: t("historique_collecte.location", "Lieu"), sortable: true, render: (c) => lieuDe(c) },
    agent: { label: t("historique_collecte.agent", "Agent"), sortable: true, render: (c) => <PersonName name={agentDe(c.personnelId)} strong={false} /> },
    progress: {
      label: t("historique_collecte.progress", "Avancement"), sortable: true,
      render: (c) => {
        const k = getCounts(c);
        return (
          <div style={{ minWidth: 150 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: 4 }}>
              <span><strong>{k.traites}</strong><span className="kit-muted"> / {k.attendus || "—"}</span></span>
              <strong style={{ color: k.pct >= 100 ? C.green : C.slate }}>{k.pct}%</strong>
            </div>
            <StackedBar counts={k} height={6} />
          </div>
        );
      },
    },
    etat: { label: t("historique_collecte.status", "État"), sortable: true, align: "center", render: (c) => <EtatPill etat={c.etatCollecte} t={t} /> },
    actions: {
      label: t("common.actions"), align: "center",
      render: (c) => <RowActions><RowButton icon={Eye} title={t("historique_collecte.collection_details", "Détails de la collecte")} onClick={() => openDetails(c)} /></RowActions>,
    },
  };

  const compteSource = (id) => collectes.filter((c) => getSource(c).id === id).length;
  const totaux = list.sorted.reduce((acc, c) => {
    const k = getCounts(c);
    SEGMENTS.forEach((s) => { acc[s.k] = (acc[s.k] || 0) + k[s.k]; });
    acc.attendus += k.attendus;
    acc.traites += k.traites;
    acc.done += isDone(c) ? 1 : 0;
    return acc;
  }, { attendus: 0, traites: 0, done: 0 });

  return (
    <Page>
      {viewMode === "list" && (
        <>
          <PageHeader
            icon={<PageHeaderIcon size={40} />}
            title={t("historique_collecte.title", "Historique des collectes")}
            subtitle={t("historique_collecte.subtitle", "Traçabilité des collectes réalisées")}
            total={list.sorted.length}
            onIconClick={() => setShowColumnSettings(true)}
          />

          <ActionBar>
            <ActionButton icon={IconDetails} label={t("historique_collecte.collection_details", "Détails de la collecte")} variant="details" disabled={!selected} onClick={() => openDetails(selected)} />
            <ActionButton icon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />} label={t("common.refresh")} variant="details" onClick={loadCollectes} />
          </ActionBar>

          <div className="kit-toolbar">
            <Tabs
              value={source}
              onChange={(v) => { setSource(v); list.setPage(1); }}
              items={[
                { value: "", label: t("historique_collecte.all_sources", "Toutes"), count: collectes.length },
                ...Object.values(SOURCES).filter((s) => compteSource(s.id) > 0).map((s) => ({
                  value: s.id, icon: <s.Icon size={15} />, label: t(`historique_collecte.${s.key}`, s.fb), count: compteSource(s.id),
                })),
              ]}
            />
          </div>

          <FilterPanel>
            <FilterRow>
              {list.isColVisible("etat") && (
                <FilterSelect
                  label={t("historique_collecte.status", "État")}
                  value={draft.etat}
                  onChange={(v) => setFilter("etat", v)}
                  allLabel={t("common.all")}
                  options={Object.keys(ETATS).map((e) => ({ value: e, label: etatLabel(e, t) }))}
                />
              )}
              <FilterColumnSelect value={draft.searchColumn} onChange={(v) => setFilter("searchColumn", v)} columns={list.columnSettings} />
              <FilterText
                label={t("common.search")}
                placeholder={t("historique_collecte.search_placeholder", "Numéro, chambre, agent…")}
                value={draft.searchTerm}
                onChange={(v) => setFilter("searchTerm", v)}
                onEnter={list.apply}
              />
              {list.isColVisible("date") && (
                <FilterDateRange from={draft.dateFrom} to={draft.dateTo} onFrom={(v) => setFilter("dateFrom", v)} onTo={(v) => setFilter("dateTo", v)} />
              )}
              <FilterActions
                onSearch={list.apply}
                count={list.sorted.length}
                onExcel={() => handleExportExcel()}
                onStats={() => setShowStats(true)}
                onReset={list.reset}
                onColumns={() => setShowColumnSettings(true)}
              />
            </FilterRow>
          </FilterPanel>

          <ListSection selection={sel} unit="collecte" units="collectes" bulkActions={[{ label: tk("exportExcel", "Exporter Excel"), onClick: (l) => handleExportExcel(l) }]}>
            <DataTable
              columns={TABLE_COLUMNS}
              visible={list.visibleColumns}
              rows={list.paginated}
              sort={list.sort}
              onSort={list.toggleSort}
              selection={sel}
              activeId={selected?.id}
              onRowClick={(c) => setSelected(selected?.id === c.id ? null : c)}
              onRowDoubleClick={openDetails}
              loading={loading && !collectes.length}
              loadingText={t("common.loading")}
              emptyText={`${t("historique_collecte.no_collections")} — ${t("historique_collecte.no_collections_hint")}`}
            />
            <Pagination total={list.sorted.length} page={list.page} totalPages={list.totalPages} pageSize={list.pageSize} onPage={list.setPage} unit={t("historique_collecte.unit", "collecte(s)")} />
          </ListSection>
        </>
      )}

      {viewMode === "details" && selected && (
        <DetailCollecte
          collecte={selected}
          resume={resumes[selected.id]}
          resumeLoading={resumeLoading && !resumes[selected.id]}
          onBack={() => setViewMode("list")}
          agentName={agentDe(selected.personnelId)}
          serviceName={serviceDe(selected.service)}
          t={t}
          relative={relative}
        />
      )}

      {showStats && (
        <QuickStats
          title={t("historique_collecte.title", "Historique des collectes")}
          subtitle={`${list.sorted.length} ${t("historique_collecte.unit", "collecte(s)")}`}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("historique_collecte.kpi_total", "Collectes"), value: list.sorted.length, color: C.teal },
            { label: t("historique_collecte.kpi_done", "Terminées"), value: totaux.done, color: C.green },
            { label: t("historique_collecte.completion", "Complétude"), value: `${totaux.attendus ? Math.min(100, Math.round((totaux.traites / totaux.attendus) * 100)) : 0}%`, color: C.sky },
            { label: t("historique_collecte.processed", "Traitées"), value: totaux.traites, color: C.violet },
          ]}
          repartitions={[
            {
              title: t("historique_collecte.outcome", "Résultat"),
              items: SEGMENTS.filter((s) => circuitInfecte || s.k !== "infectes").map((s) => ({ label: t(`historique_collecte.${s.key}`, s.fb), value: totaux[s.k] || 0, color: s.color })),
            },
            {
              title: t("historique_collecte.source", "Origine"),
              items: Object.values(SOURCES).map((s) => ({ label: t(`historique_collecte.${s.key}`, s.fb), value: list.sorted.filter((c) => getSource(c).id === s.id).length, color: s.color })),
            },
          ]}
          classements={[{
            title: t("historique_collecte.agent", "Agent"),
            items: Object.entries(list.sorted.reduce((acc, c) => { const k = agentDe(c.personnelId); acc[k] = (acc[k] || 0) + 1; return acc; }, {}))
              .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
          }]}
        />
      )}

      <ColumnSettingsModal
        show={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={list.columnSettings}
        onToggleVisibility={list.toggleColumnVisibility}
        onToggleSearch={list.toggleColumnSearchability}
      />
    </Page>
  );
}
