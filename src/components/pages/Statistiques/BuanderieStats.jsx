import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, Bell, Biohazard, CheckCircle2, ClipboardX, Droplets, Layers, PieChart as PieIcon,
  RefreshCcw, Route, Truck, Users, Warehouse, WashingMachine,
  ArrowUpRight, Hourglass, PackageCheck, RefreshCw, Shirt,
} from "lucide-react";
import { fetchLingesIncomplets } from "../../../services/analyseService";
import { useSetting } from "../../../utils/appSettings";
import { useCircuitInfecte } from "../../../hooks/useEstablishment";
import { useChartTheme } from "../../../hooks/useIsDark";
import { Page } from "../../kit";
import "./stats-board.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const ETATS = {
  LIVRE: { label: "En service", color: "#0d9488" },
  COLLECTE: { label: "Collecté", color: "#0ea5e9" },
  RECEPTION: { label: "Réception", color: "#8b5cf6" },
  EN_TRI: { label: "Tri", color: "#f59e0b" },
  EN_LAVAGE: { label: "Lavage", color: "#3b82f6" },
  LAVE: { label: "Lavé", color: "#06b6d4" },
  EN_SECHAGE: { label: "Séchage", color: "#f97316" },
  SECHE: { label: "Séché", color: "#84cc16" },
  PLIE: { label: "Plié", color: "#a855f7" },
  STOCKE: { label: "Stock", color: "#10b981" },
  MANQUANT: { label: "Manquant", color: "#ef4444" },
  HORS_SERVICE: { label: "Hors service", color: "#64748b" },
};

const MACHINES = [
  { key: "DISPONIBLE", color: "#10b981", label: "dashboard.available" },
  { key: "EN_COURS", color: "#0ea5e9", label: "dashboard.in_progress" },
  { key: "EN_MAINTENANCE", color: "#f59e0b", label: "dashboard.maintenance" },
  { key: "HORS_SERVICE", color: "#ef4444", label: "dashboard.out_of_service" },
];

const num = (n) => (Number(n) || 0).toLocaleString("fr-FR");
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);
const cleJour = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [kpisRes, stockRes, alertesRes, machinesRes, collectesRes, incompletsRes, completRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/kpis`).then((r) => (r.ok ? r.json() : {})),
        fetch(`${API_URL}/api/dashboard/stock`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_URL}/api/dashboard/alertes`).then((r) => (r.ok ? r.json() : {})),
        fetch(`${API_URL}/api/dashboard/analytique`).then((r) => (r.ok ? r.json() : {})),
        fetch(`${API_URL}/api/historique/collectes`).then((r) => (r.ok ? r.json() : [])),
        fetchLingesIncomplets({ page: 0, size: 1 }).catch(() => null),
        fetch(`${API_URL}/api/dashboard`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setData({
        kpis: { ...(kpisRes || {}), bacsInfectesEnAttente: kpisRes?.bacsInfectesEnAttente ?? completRes?.indicateurs?.bacsInfectesEnAttente ?? completRes?.bacsInfectesEnAttente },
        incomplets: incompletsRes,
        stock: Array.isArray(stockRes) ? stockRes : [],
        alertes: alertesRes || {},
        machines: machinesRes?.machines || [],
        agents: machinesRes?.activiteAgents || [],
        dist: machinesRes?.distributionEtats || {},
        collectes: Array.isArray(collectesRes) ? collectesRes : [],
        parcours: Array.isArray(completRes?.parcours) ? completRes.parcours : [],
        circuitInfecteActif: (completRes?.indicateurs?.circuitInfecteActif ?? completRes?.circuitInfecteActif) !== false,
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSeconds = Number(useSetting("refresh.statsSeconds")) || 30;
  useEffect(() => {
    const premier = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, refreshSeconds * 1000);
    return () => { clearTimeout(premier); clearInterval(interval); };
  }, [fetchData, refreshSeconds]);

  return { data, loading, error, lastUpdate, refresh: fetchData, refreshSeconds };
}

function Tuile({ titre, icon, extra, className = "", children }) {
  return (
    <section className={`sb-card ${className}`}>
      {(titre || extra) && (
        <header className="sb-card__head">
          {titre && <h3>{icon}{titre}</h3>}
          {extra && <div className="sb-card__extra">{extra}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

function Vide({ icon, texte }) {
  return <div className="sb-empty">{icon}<span>{texte}</span></div>;
}

function InfoBulle({ active, payload, label, unite }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sb-tip">
      {label && <strong>{label}</strong>}
      {payload.map((p) => (
        <span key={p.dataKey}><i style={{ background: p.color || p.stroke }} />{p.name} : <b>{num(p.value)}</b>{unite ? ` ${unite}` : ""}</span>
      ))}
    </div>
  );
}

function Anneau({ valeur, couleur, taille = 64 }) {
  const r = taille / 2 - 6;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, valeur || 0));
  return (
    <svg className="sb-ring" width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} aria-hidden="true">
      <circle cx={taille / 2} cy={taille / 2} r={r} className="sb-ring__track" />
      <circle
        cx={taille / 2}
        cy={taille / 2}
        r={r}
        className="sb-ring__value"
        style={{ stroke: couleur }}
        strokeDasharray={c}
        strokeDashoffset={c - (c * v) / 100}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{v}%</text>
    </svg>
  );
}

function CarteFlux({ parcours, dist }) {
  const { t } = useTranslation();
  const ct = useChartTheme();
  const points = parcours.length
    ? [...parcours].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)).map((e) => ({ nom: e.nom || e.code, valeur: e.nbLinges || 0 }))
    : Object.entries(dist).map(([k, v]) => ({ nom: ETATS[k]?.label || k, valeur: v || 0 }));
  const top = [...points].sort((a, b) => b.valeur - a.valeur).slice(0, 5);
  const total = points.reduce((s, p) => s + p.valeur, 0);

  return (
    <Tuile
      className="sb-span-7"
      titre={t("stats_board.flow_title", "Parcours du linge")}
      icon={<Route size={15} />}
      extra={<span className="sb-pill">{num(total)} {t("dashboard.linens")}</span>}
    >
      {points.length === 0 ? (
        <Vide icon={<Route size={22} />} texte={t("common.no_data", "Aucune donnée")} />
      ) : (
        <div className="sb-flux">
          <div className="sb-flux__chart">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={points} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="sbFlux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0794a4" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#0794a4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={ct.grid} vertical={false} />
                <XAxis dataKey="nom" tick={{ fontSize: 10, fill: ct.ticks }} axisLine={false} tickLine={false} interval={0} angle={-20} dy={8} height={42} />
                <YAxis tick={{ fontSize: 10, fill: ct.ticks }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<InfoBulle />} cursor={{ stroke: "#0794a4", strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="valeur" name={t("dashboard.linens")} stroke="#0794a4" strokeWidth={2.5} fill="url(#sbFlux)" dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ul className="sb-flux__top">
            <li className="sb-flux__label">{t("stats_board.top_steps", "Étapes les plus chargées")}</li>
            {top.map((p) => (
              <li key={p.nom}>
                <span>{p.nom}</span>
                <b>{num(p.valeur)}</b>
                <small>{pct(p.valeur, total)}%</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tuile>
  );
}

function CarteJour({ kpis, lastUpdate, loading, refreshSeconds, onRefresh, refreshing }) {
  const { t, i18n } = useTranslation();
  const maintenant = lastUpdate || new Date();
  const lundi = new Date(maintenant);
  lundi.setDate(maintenant.getDate() - ((maintenant.getDay() + 6) % 7));
  const semaine = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi);
    d.setDate(lundi.getDate() + i);
    return d;
  });
  const langue = i18n.language || "fr";

  return (
    <Tuile className="sb-span-5 sb-today">
      <div className="sb-today__top">
        <div>
          <span className="sb-today__month">{maintenant.toLocaleDateString(langue, { month: "long", year: "numeric" })}</span>
          <strong className="sb-today__day">{maintenant.toLocaleDateString(langue, { weekday: "long", day: "numeric" })}</strong>
        </div>
        <button type="button" className="sb-icon-btn" onClick={onRefresh} disabled={refreshing} aria-label={t("dashboard.refresh")} title={t("dashboard.refresh")}>
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
      <ol className="sb-week">
        {semaine.map((d) => {
          const aujourdHui = cleJour(d) === cleJour(maintenant);
          return (
            <li key={cleJour(d)} className={aujourdHui ? "is-today" : ""}>
              <small>{d.toLocaleDateString(langue, { weekday: "short" })}</small>
              <b>{d.getDate()}</b>
            </li>
          );
        })}
      </ol>
      <div className="sb-today__figures">
        <div>
          <span className="sb-today__icon is-violet"><Truck size={16} /></span>
          <small>{t("dashboard.collections_today")}</small>
          <strong>{num(kpis.collectesAujourdhui)}</strong>
        </div>
        <div>
          <span className="sb-today__icon is-blue"><Droplets size={16} /></span>
          <small>{t("dashboard.washes_today")}</small>
          <strong>{num(kpis.lavagesAujourdhui)}</strong>
        </div>
      </div>
      <footer className="sb-today__foot">
        <span className={`sb-live ${loading ? "" : "is-on"}`}><i />{t("dashboard.auto_update")} · {refreshSeconds}s</span>
        <small>{lastUpdate ? `${t("dashboard.last_update")} ${lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : t("dashboard.waiting_for_data")}</small>
      </footer>
    </Tuile>
  );
}

function CarteCollectes({ collectes, circuitInfecte, reference }) {
  const { t, i18n } = useTranslation();
  const jours = useMemo(() => {
    const base = reference || new Date();
    const liste = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - (6 - i));
      return { cle: cleJour(d), nom: d.toLocaleDateString(i18n.language || "fr", { weekday: "short", day: "numeric" }), blancs: 0, infectes: 0, nb: 0 };
    });
    const index = new Map(liste.map((j) => [j.cle, j]));
    collectes.forEach((c) => {
      if (!c.dateCollecte) return;
      const j = index.get(cleJour(new Date(c.dateCollecte)));
      if (!j) return;
      j.blancs += (c.nbBlancs || 0) + (c.nbPropres || 0);
      j.infectes += c.nbInfectes || 0;
      j.nb += 1;
    });
    return liste;
  }, [collectes, reference, i18n.language]);

  const totalBlancs = jours.reduce((s, j) => s + j.blancs, 0);
  const totalInfectes = jours.reduce((s, j) => s + j.infectes, 0);
  const totalCollectes = jours.reduce((s, j) => s + j.nb, 0);

  return (
    <Tuile
      className="sb-span-7 sb-hero"
      titre={t("stats_board.collections_week", "Collectes — 7 derniers jours")}
      icon={<Truck size={15} />}
      extra={<span className="sb-pill is-glass">{num(totalCollectes)} {t("stats_board.collections", "collectes")}</span>}
    >
      <div className="sb-hero__tags">
        <span className="sb-hero__tag"><i className="is-white" />{t("stats_board.white_linen", "Linge blanc")} <b>{num(totalBlancs)}</b></span>
        {circuitInfecte && <span className="sb-hero__tag is-red"><i className="is-red" />{t("stats_board.infected_linen", "Linge infecté")} <b>{num(totalInfectes)}</b></span>}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={jours} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.14)" vertical={false} />
          <XAxis dataKey="nom" tick={{ fontSize: 10, fill: "rgba(255,255,255,.75)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,.6)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<InfoBulle />} cursor={{ stroke: "rgba(255,255,255,.4)" }} />
          <Line className="sb-glow" type="monotone" dataKey="blancs" name={t("stats_board.white_linen", "Linge blanc")} stroke="#ffffff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#fff", stroke: "rgba(255,255,255,.4)", strokeWidth: 8 }} />
          {circuitInfecte && (
            <Line className="sb-glow is-red" type="monotone" dataKey="infectes" name={t("stats_board.infected_linen", "Linge infecté")} stroke="#fb7185" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#fb7185", stroke: "rgba(251,113,133,.35)", strokeWidth: 8 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Tuile>
  );
}

function CarteIndicateurs({ kpis, circuitInfecte, masques }) {
  const { t } = useTranslation();
  const total = Number(kpis.totalLinges) || Number(kpis.lingesActifs) || 0;
  const items = [
    { id: "disponibles", label: t("dashboard.available_linens"), valeur: kpis.lingesDisponibles, p: pct(kpis.lingesDisponibles, total), color: "#10b981" },
    { id: "circuit", label: t("dashboard.in_circuit"), valeur: kpis.lingesEnCircuit, p: pct(kpis.lingesEnCircuit, total), color: "#0ea5e9" },
    { id: "actifs", label: t("dashboard.active_linens"), valeur: kpis.lingesActifs, p: pct(kpis.lingesActifs, total), color: "#0794a4" },
    { id: "finDeVie", label: t("dashboard.end_of_life"), valeur: kpis.lingesProcheFin, p: pct(kpis.lingesProcheFin, total), color: "#ef4444" },
    ...(circuitInfecte ? [{ id: "infection", label: t("dashboard.infection_rate"), valeur: null, p: Math.round(Number(kpis.tauxInfectionMois) || 0), color: "#f59e0b" }] : []),
  ].filter((k) => !masques.includes(k.id)).slice(0, 4);

  return (
    <Tuile className="sb-span-5" titre={t("stats_board.indicators", "Indicateurs du parc")} icon={<Activity size={15} />} extra={<span className="sb-pill">{num(total)} {t("dashboard.linens")}</span>}>
      <div className="sb-kpis">
        {items.map((k) => (
          <div key={k.id} className="sb-kpi">
            <Anneau valeur={k.p} couleur={k.color} />
            <div>
              <strong>{k.valeur != null ? num(k.valeur) : `${k.p}%`}</strong>
              <small>{k.label}</small>
            </div>
          </div>
        ))}
      </div>
    </Tuile>
  );
}

function CarteMachines({ machines, taux }) {
  const { t } = useTranslation();
  const total = machines.length;
  const compte = Object.fromEntries(MACHINES.map((m) => [m.key, machines.filter((x) => x.etat === m.key).length]));
  const occupation = taux != null ? Math.round(Number(taux) || 0) : pct(compte.EN_COURS, total);
  const cycles = machines.reduce((s, m) => s + (m.cyclesAujourdhui || 0), 0);
  const poids = machines.reduce((s, m) => s + (Number(m.poidsTraiteAujourdhui) || 0), 0);
  const r = 62;
  const c = 2 * Math.PI * r;

  return (
    <Tuile className="sb-span-4 sb-machines" titre={t("dashboard.machine_status")} icon={<WashingMachine size={15} />} extra={<span className="sb-pill is-glass">{total} {t("dashboard.machines")}</span>}>
      {total === 0 ? (
        <Vide icon={<WashingMachine size={22} />} texte={t("dashboard.no_machines")} />
      ) : (
        <>
          <div className="sb-machines__gauge">
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <defs>
                <linearGradient id="sbGauge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r={r} className="sb-gauge__track" />
              <circle cx="80" cy="80" r={r} className="sb-gauge__value" strokeDasharray={c} strokeDashoffset={c - (c * occupation) / 100} />
            </svg>
            <div className="sb-machines__center">
              <strong>{occupation}%</strong>
              <small>{t("stats_board.occupancy", "Occupation")}</small>
            </div>
          </div>
          <ul className="sb-machines__states">
            {MACHINES.map((m) => (
              <li key={m.key}><i style={{ background: m.color }} />{t(m.label)}<b>{compte[m.key]}</b></li>
            ))}
          </ul>
          <div className="sb-machines__today">
            <span><b>{num(cycles)}</b> {t("dashboard.cycles")}</span>
            <span><b>{num(Math.round(poids))}</b> kg</span>
          </div>
        </>
      )}
    </Tuile>
  );
}

function CarteEtats({ dist }) {
  const { t } = useTranslation();
  const lignes = Object.entries(dist)
    .map(([k, v]) => ({ cle: k, nom: ETATS[k]?.label || k, valeur: Number(v) || 0, color: ETATS[k]?.color || "#94a3b8" }))
    .filter((l) => l.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur);
  const total = lignes.reduce((s, l) => s + l.valeur, 0);

  return (
    <Tuile className="sb-span-4" titre={t("dashboard.linen_distribution")} icon={<PieIcon size={15} />}>
      {lignes.length === 0 ? (
        <Vide icon={<PieIcon size={22} />} texte={t("common.no_data", "Aucune donnée")} />
      ) : (
        <div className="sb-donut">
          <div className="sb-donut__chart">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={lignes} dataKey="valeur" nameKey="nom" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                  {lignes.map((l) => <Cell key={l.cle} fill={l.color} />)}
                </Pie>
                <Tooltip content={<InfoBulle />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sb-donut__center"><strong>{num(total)}</strong><small>{t("dashboard.linens")}</small></div>
          </div>
          <ul className="sb-legend">
            {lignes.slice(0, 6).map((l) => (
              <li key={l.cle}>
                <span className="sb-legend__pct" style={{ background: l.color }}>{pct(l.valeur, total)}%</span>
                <span className="sb-legend__name">{l.nom}</span>
                <b>{num(l.valeur)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tuile>
  );
}

function CarteStock({ services }) {
  const { t } = useTranslation();
  const lignes = [...services].sort((a, b) => (b.nbTotal || 0) - (a.nbTotal || 0)).slice(0, 10);

  return (
    <Tuile
      className="sb-span-8"
      titre={t("dashboard.stock_by_service")}
      icon={<Warehouse size={15} />}
      extra={(
        <div className="sb-keys">
          <span><i className="is-teal" />{t("dashboard.in_place")}</span>
          <span><i className="is-amber" />{t("dashboard.in_circuit")}</span>
          <span><i className="is-green" />{t("dashboard.available_short", "Disponibles")}</span>
        </div>
      )}
    >
      {lignes.length === 0 ? (
        <Vide icon={<Warehouse size={22} />} texte={t("dashboard.no_stock_data")} />
      ) : (
        <div className="sb-columns">
          {lignes.map((s, i) => {
            const total = s.nbTotal || 0;
            const h = (v) => `${total > 0 ? Math.max(4, (v / total) * 100) : 0}%`;
            return (
              <div key={s.serviceCode || i} className="sb-col" title={`${s.serviceCode} · ${num(total)}`}>
                <div className="sb-col__bars">
                  <span className="sb-capsule is-teal"><i style={{ height: h(s.nbLivre || 0) }} /></span>
                  <span className="sb-capsule is-amber"><i style={{ height: h(s.nbEnCircuit || 0) }} /></span>
                  <span className="sb-capsule is-green"><i style={{ height: h(s.nbStocke || 0) }} /></span>
                </div>
                <b>{num(total)}</b>
                <small>{s.serviceCode || "—"}</small>
              </div>
            );
          })}
        </div>
      )}
    </Tuile>
  );
}

function CarteAlertes({ alertes }) {
  const { t } = useTranslation();
  const toutes = [
    ...(alertes?.stockCritique || []),
    ...(alertes?.lingesBloqués || []).slice(0, 3),
    ...(alertes?.finDeVie || []).slice(0, 3),
  ];
  return (
    <Tuile
      className="sb-span-4"
      titre={t("dashboard.alerts")}
      icon={<Bell size={15} />}
      extra={toutes.length > 0 ? <span className="sb-pill is-danger">{toutes.length}</span> : null}
    >
      {toutes.length === 0 ? (
        <div className="sb-ok">
          <CheckCircle2 size={28} />
          <strong>{t("dashboard.all_under_control")}</strong>
          <small>{t("dashboard.no_alerts")}</small>
        </div>
      ) : (
        <ul className="sb-alerts">
          {toutes.slice(0, 5).map((a, i) => (
            <li key={i} className={a.niveau === "CRITICAL" ? "is-critical" : ""}>
              <AlertTriangle size={14} />
              <div>
                <strong>{a.message || t("dashboard.alert")}</strong>
                {a.detail && <small>{a.detail}</small>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tuile>
  );
}

function KpiCarte({ label, valeur, icon, couleur, part, detail, onClick }) {
  const cliquable = typeof onClick === "function";
  const Balise = cliquable ? "button" : "div";
  return (
    <Balise
      type={cliquable ? "button" : undefined}
      className={`sb-kpicard ${cliquable ? "is-clickable" : ""}`}
      style={{ "--k": couleur }}
      onClick={onClick}
    >
      <span className="sb-kpicard__top">
        <span className="sb-kpicard__icon">{icon}</span>
        <span className="sb-kpicard__label">{label}</span>
        {cliquable && <ArrowUpRight size={15} className="sb-kpicard__go" />}
      </span>
      <strong className="sb-kpicard__value">{valeur}</strong>
      <span className="sb-kpicard__foot">
        {part != null ? (
          <>
            <span className="sb-kpicard__bar"><i style={{ width: `${Math.min(100, part)}%` }} /></span>
            <small>{part}%</small>
          </>
        ) : (
          <small>{detail}</small>
        )}
      </span>
    </Balise>
  );
}

function RangeeKpis({ kpis, incomplets, circuitInfecte, masques, onIncomplets }) {
  const { t } = useTranslation();
  const total = Number(kpis.totalLinges) || 0;
  const part = (v) => (total > 0 && v != null ? pct(v, total) : null);
  const items = [
    { id: "actifs", label: t("dashboard.active_linens"), valeur: num(kpis.lingesActifs), icon: <Shirt size={18} />, couleur: "#0794a4", part: part(kpis.lingesActifs) },
    { id: "disponibles", label: t("dashboard.available_linens"), valeur: num(kpis.lingesDisponibles), icon: <PackageCheck size={18} />, couleur: "#10b981", part: part(kpis.lingesDisponibles) },
    { id: "circuit", label: t("dashboard.in_circuit"), valeur: num(kpis.lingesEnCircuit), icon: <RefreshCw size={18} />, couleur: "#0ea5e9", part: part(kpis.lingesEnCircuit) },
    { id: "collectes", label: t("dashboard.collections_today"), valeur: num(kpis.collectesAujourdhui), icon: <Truck size={18} />, couleur: "#8b5cf6", detail: t("stats_board.today", "Aujourd'hui") },
    { id: "lavages", label: t("dashboard.washes_today"), valeur: num(kpis.lavagesAujourdhui), icon: <Droplets size={18} />, couleur: "#3b82f6", detail: t("stats_board.today", "Aujourd'hui") },
    { id: "incomplets", label: t("dashboard.incomplete_linens", "Linges incomplets"), valeur: incomplets ? num(incomplets.total) : "—", icon: <ClipboardX size={18} />, couleur: "#f59e0b", detail: t("dashboard.incomplete_linens_hint", "Voir les linges incomplets"), onClick: onIncomplets },
    { id: "finDeVie", label: t("dashboard.end_of_life"), valeur: num(kpis.lingesProcheFin), icon: <Hourglass size={18} />, couleur: "#ef4444", part: part(kpis.lingesProcheFin) },
    ...(circuitInfecte ? [
      { id: "bacsInfectes", label: t("dashboard.infected_bins_waiting", "Bacs infectés en attente"), valeur: num(kpis.bacsInfectesEnAttente), icon: <Biohazard size={18} />, couleur: "#dc2626", detail: t("dashboard.infected_bins_waiting_hint", "Collectés ou en réception") },
    ] : []),
  ].filter((k) => !masques.includes(k.id));

  if (!items.length) return null;
  return (
    <div className="sb-span-12 sb-kpirow">
      {items.map(({ id, ...k }) => <KpiCarte key={id} {...k} />)}
    </div>
  );
}

function CarteEquipe({ agents }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...agents.map((a) => a.nbOperations || 0));
  return (
    <Tuile className="sb-span-4" titre={t("dashboard.active_agents")} icon={<Users size={15} />} extra={<span className="sb-pill">{agents.length}</span>}>
      {agents.length === 0 ? (
        <Vide icon={<Users size={22} />} texte={t("dashboard.no_active_agents")} />
      ) : (
        <ul className="sb-team">
          {agents.slice(0, 8).map((a, i) => {
            const initiales = (a.nomComplet || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <li key={a.nomComplet || i}>
                <span className="sb-avatar" style={{ "--h": (i * 47) % 360 }}>{initiales}</span>
                <div>
                  <strong>{a.nomComplet || t("dashboard.agent")}</strong>
                  <small>{a.etapeActive || "—"}</small>
                  <span className="sb-team__bar"><i style={{ width: `${((a.nbOperations || 0) / max) * 100}%` }} /></span>
                </div>
                <b>{num(a.nbOperations)}<small>{t("dashboard.ops")}</small></b>
              </li>
            );
          })}
        </ul>
      )}
    </Tuile>
  );
}

export default function BuanderieStats() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, error, lastUpdate, refresh, refreshSeconds } = useDashboard();
  const masques = useSetting("dashboard.hiddenKpis") || [];
  const circuitEtablissement = useCircuitInfecte();
  const [refreshing, setRefreshing] = useState(false);

  const actualiser = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const kpis = data?.kpis || {};
  const circuitInfecte = circuitEtablissement && data?.circuitInfecteActif !== false;

  return (
    <Page className="sb-page">
      {error && (
        <div className="sb-error" role="alert"><AlertTriangle size={16} /> {error}</div>
      )}

      {loading && !data ? (
        <div className="sb-loading"><Layers size={22} /> {t("dashboard.loading")}</div>
      ) : (
        <div className="sb-grid">
          <RangeeKpis kpis={kpis} incomplets={data?.incomplets} circuitInfecte={circuitInfecte} masques={masques} onIncomplets={() => navigate("/linges?incomplets")} />
          <CarteFlux parcours={data?.parcours || []} dist={data?.dist || {}} />
          <CarteJour kpis={kpis} lastUpdate={lastUpdate} loading={loading} refreshSeconds={refreshSeconds} onRefresh={actualiser} refreshing={refreshing} />
          <CarteCollectes collectes={data?.collectes || []} circuitInfecte={circuitInfecte} reference={lastUpdate} />
          <CarteIndicateurs kpis={kpis} circuitInfecte={circuitInfecte} masques={masques} />
          <CarteMachines machines={data?.machines || []} taux={kpis.tauxOccupationMachines} />
          <CarteEtats dist={data?.dist || {}} />
          <CarteAlertes alertes={data?.alertes} />
          <CarteStock services={data?.stock || []} />
          <CarteEquipe agents={data?.agents || []} />
        </div>
      )}
    </Page>
  );
}
