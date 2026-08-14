import React, { useState, useEffect, useCallback } from "react";
import {
  FaSync, FaBell, FaArrowUp, FaArrowDown,
  FaTshirt, FaSoap, FaWind, FaBoxes, FaTruck,
  FaBiohazard, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaChevronRight,
  FaWarehouse, FaUsers, FaWrench, FaChartLine,
  FaIndustry, FaCircle, FaMicrochip
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

// ─── Variables d'environnement ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

// ─── Couleurs ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#0d9488",
  primaryLight: "#ccfbf1",
  accent: "#14b8a6",
  info: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  surface: "#ffffff",
  dark: "#1e293b"
};

// ─── États du linge ──────────────────────────────────────────────────────────
const ETATS = {
  LIVRE: { label: "En service", color: "#0d9488", bg: "#ccfbf1", icon: "🛏️" },
  COLLECTE: { label: "Collecté", color: "#0ea5e9", bg: "#e0f2fe", icon: "🚚" },
  RECEPTION: { label: "Réception", color: "#8b5cf6", bg: "#ede9fe", icon: "📥" },
  EN_TRI: { label: "Tri", color: "#f59e0b", bg: "#fef3c7", icon: "🔀" },
  EN_LAVAGE: { label: "Lavage", color: "#3b82f6", bg: "#dbeafe", icon: "🫧" },
  LAVE: { label: "Lavé", color: "#06b6d4", bg: "#cffafe", icon: "💧" },
  EN_SECHAGE: { label: "Séchage", color: "#f97316", bg: "#ffedd5", icon: "🌬️" },
  SECHE: { label: "Séché", color: "#84cc16", bg: "#ecfccb", icon: "☀️" },
  PLIE: { label: "Plié", color: "#a855f7", bg: "#f3e8ff", icon: "📐" },
  STOCKE: { label: "Stock", color: "#10b981", bg: "#d1fae5", icon: "📦" },
  MANQUANT: { label: "Manquant", color: "#ef4444", bg: "#fee2e2", icon: "❓" },
  HORS_SERVICE: { label: "Hors service", color: "#64748b", bg: "#f1f5f9", icon: "🗑️" },
};

const CYCLE_FLUX = [
  "LIVRE", "COLLECTE", "RECEPTION", "EN_TRI",
  "EN_LAVAGE", "LAVE", "EN_SECHAGE", "SECHE", "PLIE", "STOCKE"
];

const num = (n) => (n ?? 0).toLocaleString("fr-FR");
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";

// ─── Hook Dashboard ──────────────────────────────────────────────────────────
function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [kpisRes, stockRes, alertesRes, machinesRes, collectesRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/kpis`).then(r => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/dashboard/stock`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/dashboard/alertes`).then(r => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/dashboard/analytique`).then(r => r.ok ? r.json() : {}),
        fetch(`${API_URL}/api/historique/collectes`).then(r => r.ok ? r.json() : []),
      ]);

      const dist = machinesRes?.distributionEtats || {};
      
      setData({
        kpis: kpisRes,
        stock: Array.isArray(stockRes) ? stockRes : [],
        alertes: alertesRes,
        machines: machinesRes?.machines || [],
        agents: machinesRes?.activiteAgents || [],
        dist,
        collectes: Array.isArray(collectesRes) ? collectesRes.slice(0, 5) : [],
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastUpdate, refresh: fetchData };
}

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, subtitle }) {
  return (
    <Card className="hover:shadow-md transition-shadow border-slate-100">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{num(value)}</p>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}12`, color }}
          >
            <span className="text-base">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Flux de production ──────────────────────────────────────────────────────
function ProductionFlow({ dist, total }) {
  const etapes = CYCLE_FLUX.map(etat => ({
    ...ETATS[etat],
    id: etat,
    value: dist[etat.toLowerCase()] ?? dist[etat] ?? 0
  }));

  return (
    <Card className="border-slate-100">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FaIndustry className="text-teal-500" size={14} />
              Flux de production
            </h3>
            <p className="text-[10px] text-slate-400">{num(total)} articles en circulation</p>
          </div>
          <Badge variant="outline" className="text-[9px] font-normal">Temps réel</Badge>
        </div>

        <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
          {etapes.map((etape, idx) => {
            const pctVal = total > 0 ? (etape.value / total) * 100 : 0;
            const isLast = idx === etapes.length - 1;
            const isActive = etape.value > 0;
            
            return (
              <div key={etape.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center min-w-[44px]">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{ 
                      background: isActive ? etape.bg : '#f1f5f9',
                      border: `2px solid ${isActive ? etape.color : '#e2e8f0'}`,
                      opacity: isActive ? 1 : 0.4
                    }}
                  >
                    {etape.icon}
                  </div>
                  <span 
                    className="text-[7px] font-medium mt-0.5 text-center leading-tight"
                    style={{ color: isActive ? etape.color : '#94a3b8' }}
                  >
                    {etape.label}
                  </span>
                  {isActive && (
                    <span className="text-[7px] font-bold" style={{ color: etape.color }}>
                      {etape.value}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div className="flex items-center px-0.5 pb-4">
                    <div className="w-3 h-[1.5px] bg-slate-200" />
                    <FaChevronRight className="w-2 h-2 text-slate-300 -ml-0.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barre de progression */}
        <div className="flex h-1 rounded-full overflow-hidden mt-2">
          {etapes.map(etape => {
            const pctVal = total > 0 ? (etape.value / total) * 100 : 0;
            return pctVal > 0 ? (
              <div 
                key={etape.id}
                className="h-full transition-all duration-500"
                style={{ width: `${pctVal}%`, background: etape.color }}
              />
            ) : null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stock Services ──────────────────────────────────────────────────────────
function StockServices({ services }) {
  if (!services || services.length === 0) {
    return (
      <Card className="border-slate-100 h-full">
        <CardContent className="p-5 flex items-center justify-center h-32">
          <p className="text-sm text-slate-400">Aucune donnée stock</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FaWarehouse className="text-teal-500" size={14} />
          <h3 className="text-sm font-bold text-slate-700">Stock par service</h3>
          <Badge variant="outline" className="text-[9px] font-normal ml-auto">
            {services.length} services
          </Badge>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {services.slice(0, 6).map((s, i) => {
            const total = s.nbTotal || 1;
            const livrePct = pct(s.nbLivre, total);
            const circPct = pct(s.nbEnCircuit, total);
            
            const statutColor = s.statut === "CRITIQUE" ? COLORS.danger :
                              s.statut === "ATTENTION" ? COLORS.warning : COLORS.success;

            return (
              <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statutColor }} />
                    <span className="text-xs font-semibold text-slate-700">{s.serviceCode}</span>
                    {s.serviceNom && s.serviceNom !== s.serviceCode && (
                      <span className="text-[10px] text-slate-400">{s.serviceNom}</span>
                    )}
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-teal-600 font-medium">🛏️ {s.nbLivre}</span>
                    <span className="text-slate-400">🔄 {s.nbEnCircuit}</span>
                  </div>
                </div>
                <div className="flex h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all" style={{ width: `${livrePct}%` }} />
                  <div className="h-full bg-blue-400 transition-all" style={{ width: `${circPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Machines ──────────────────────────────────────────────────────────────
function Machines({ machines }) {
  if (!machines || machines.length === 0) {
    return (
      <Card className="border-slate-100 h-full">
        <CardContent className="p-5 flex items-center justify-center h-32">
          <p className="text-sm text-slate-400">Aucune machine</p>
        </CardContent>
      </Card>
    );
  }

  const etatConfig = {
    EN_COURS: { bg: "#dbeafe", color: COLORS.info, dot: "#3b82f6", label: "En cours" },
    DISPONIBLE: { bg: "#d1fae5", color: COLORS.success, dot: COLORS.success, label: "Dispo" },
    EN_MAINTENANCE: { bg: "#fef3c7", color: COLORS.warning, dot: COLORS.warning, label: "Maint." },
    HORS_SERVICE: { bg: "#fee2e2", color: COLORS.danger, dot: COLORS.danger, label: "HS" },
  };

  const typeIcon = { LAVEUR: "🫧", SECHEUR: "🌬️", LAVEUR_SECHEUR: "🔁" };

  return (
    <Card className="border-slate-100 h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaWrench className="text-teal-500" size={14} />
          <h3 className="text-sm font-bold text-slate-700">Machines</h3>
          <Badge variant="outline" className="text-[9px] font-normal ml-auto">
            {machines.filter(m => m.etat === "EN_COURS").length}/{machines.length} actif
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {machines.slice(0, 4).map((m, i) => {
            const e = etatConfig[m.etat] || { bg: "#f1f5f9", color: COLORS.muted, dot: COLORS.muted, label: m.etat };
            return (
              <div 
                key={i}
                className="p-2.5 rounded-lg border"
                style={{ background: e.bg, borderColor: e.color + '20' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{typeIcon[m.type] || "⚙️"}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.dot }} />
                    <span className="text-[8px] font-medium" style={{ color: e.color }}>{e.label}</span>
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{m.code}</p>
                <div className="flex gap-1.5 mt-1.5 text-[9px]">
                  <span className="bg-white/70 rounded px-1.5 py-0.5 flex-1 text-center">
                    <span className="font-bold text-slate-700">{m.cyclesAujourdhui || 0}</span>
                    <span className="text-slate-400 block text-[7px]">cycles</span>
                  </span>
                  <span className="bg-white/70 rounded px-1.5 py-0.5 flex-1 text-center">
                    <span className="font-bold text-slate-700">{m.poidsTraiteAujourdhui || 0}</span>
                    <span className="text-slate-400 block text-[7px]">kg</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Alertes ──────────────────────────────────────────────────────────────
function AlertesWidget({ alertes }) {
  const all = [
    ...(alertes?.stockCritique || []),
    ...(alertes?.sacsEnAttente || []),
    ...(alertes?.lingesBloqués || []).slice(0, 3),
    ...(alertes?.finDeVie || []).slice(0, 3),
  ];

  const isCritical = all.some(a => a.niveau === "CRITICAL");

  return (
    <Card className={`border-slate-100 h-full ${isCritical ? 'border-red-200' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaBell className={isCritical ? "text-red-500" : "text-teal-500"} size={14} />
          <h3 className="text-sm font-bold text-slate-700">Alertes</h3>
          {all.length > 0 && (
            <Badge variant={isCritical ? "destructive" : "outline"} className="text-[9px] font-normal ml-auto">
              {all.length}
            </Badge>
          )}
        </div>

        {all.length === 0 ? (
          <div className="text-center py-4">
            <FaCheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Tout est normal</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {all.slice(0, 4).map((a, i) => {
              const isCrit = a.niveau === "CRITICAL";
              return (
                <div 
                  key={i}
                  className="p-2 rounded-lg text-xs flex items-start gap-2"
                  style={{ 
                    background: isCrit ? "#fee2e2" : "#fef3c7",
                    border: `1px solid ${isCrit ? "#fca5a5" : "#fde68a"}`
                  }}
                >
                  <span className="mt-0.5 text-xs flex-shrink-0">
                    {a.type?.includes("SAC") ? <FaBiohazard /> : <FaExclamationTriangle />}
                  </span>
                  <p className="text-[11px] font-medium text-slate-700 truncate">{a.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Collectes ─────────────────────────────────────────────────────────────
function CollectesRecentes({ collectes }) {
  const typeIcon = { MIXTE: "🏢", CHAMBRE: "🏠", UNIFORME: "👔" };

  return (
    <Card className="border-slate-100 h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaTruck className="text-teal-500" size={14} />
          <h3 className="text-sm font-bold text-slate-700">Collectes récentes</h3>
        </div>

        {collectes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400">Aucune collecte</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {collectes.map((c, i) => {
              const total = (c.nbBlancs || 0) + (c.nbInfectes || 0);
              return (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                  <span className="text-base">{typeIcon[c.typeCollecte] || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {c.serviceCode || c.codeChambre || c.agentNom || c.numeroCollecte}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {c.dateCollecte ? new Date(c.dateCollecte).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  {total > 0 && (
                    <span className="text-[10px] font-semibold text-teal-600">{total}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Agents ──────────────────────────────────────────────────────────────
function AgentsActifs({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <Card className="border-slate-100 h-full">
        <CardContent className="p-5 flex items-center justify-center h-32">
          <p className="text-sm text-slate-400">Aucun agent actif</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaUsers className="text-teal-500" size={14} />
          <h3 className="text-sm font-bold text-slate-700">Agents actifs</h3>
          <Badge variant="outline" className="text-[9px] font-normal ml-auto">
            {agents.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {agents.slice(0, 4).map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}
              >
                {a.nomComplet?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{a.nomComplet}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 transition-all rounded-full"
                      style={{ width: `${Math.min((a.nbOperations / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-teal-600 flex-shrink-0">{a.nbOperations}</span>
                </div>
              </div>
              {a.etapeActive && (
                <span className="text-[8px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  {a.etapeActive}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
export default function BuanderieDashboard() {
  const { data, loading, error, lastUpdate, refresh } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const kpis = data?.kpis || {};
  const dist = data?.dist || {};
  const total = Object.values(dist).reduce((s, v) => s + (v || 0), 0);

  return (
    <div >
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <FaTshirt size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Buanderie Hospitalière</h1>
            <p className="text-xs text-slate-400">
              {loading ? 'Chargement...' : 
               lastUpdate ? `Dernière mise à jour · ${lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` :
               'En attente de données'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs gap-1.5 border-slate-200"
        >
          <FaSync className={isRefreshing ? 'animate-spin' : ''} size={11} />
          Actualiser
        </Button>
      </div>

      {/* ─── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <FaExclamationTriangle size={12} />
          {error}
        </div>
      )}

      {/* ─── KPI ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Linges actifs" value={kpis.lingesActifs} icon="🧺" color={COLORS.primary} />
        <KpiCard label="Disponibles" value={kpis.lingesDisponibles} icon="📦" color={COLORS.success} />
        <KpiCard label="En circuit" value={kpis.lingesEnCircuit} icon="🔄" color={COLORS.info} />
        <KpiCard label="Collectes" value={kpis.collectesAujourdhui} icon="🚚" color={COLORS.purple} />
        <KpiCard label="Lavages" value={kpis.lavagesAujourdhui} icon="🫧" color="#3b82f6" />
        <KpiCard label="Sacs infectés" value={kpis.sacsInfectesEnAttente} icon="⚠️" color={COLORS.warning} />
        <KpiCard label="Fin de vie" value={kpis.lingesProcheFin} icon="🔴" color={COLORS.danger} />
        <KpiCard label="Taux infection" value={kpis.tauxInfectionMois != null ? `${kpis.tauxInfectionMois}%` : '—'} icon="🦠" color={COLORS.warning} />
      </div>

      {/* ─── Flux ──────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <ProductionFlow dist={dist} total={total} />
      </div>

      {/* ─── Grille secondaire ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stock - 5 colonnes */}
        <div className="lg:col-span-5">
          <StockServices services={data?.stock || []} />
        </div>

        {/* Alertes + Collectes - 4 colonnes */}
        <div className="lg:col-span-4 space-y-4">
          <AlertesWidget alertes={data?.alertes || {}} />
          <CollectesRecentes collectes={data?.collectes || []} />
        </div>

        {/* Machines + Agents - 3 colonnes */}
        <div className="lg:col-span-3 space-y-4">
          <Machines machines={data?.machines || []} />
          <AgentsActifs agents={data?.agents || []} />
        </div>
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-5 pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
        <span>Mise à jour automatique · 30s</span>
        <span>
          {num(kpis.totalLinges)} linges total · {pct(kpis.tauxOccupationMachines, 100)}% machines en cours
        </span>
      </div>
    </div>
  );
}