import React, { useState, useEffect, useCallback } from "react";
import {
  FaSync, FaBell, FaArrowUp, FaArrowDown,
  FaTshirt, FaSoap, FaWind, FaBoxes, FaTruck,
  FaBiohazard, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaChevronRight,
  FaWarehouse, FaUsers, FaWrench, FaChartLine,
  FaIndustry, FaCircle, FaMicrochip,
  FaChartPie, FaChartBar, FaCalendarAlt,
  FaPercent, FaLayerGroup, FaBuilding,
  FaUserCheck, FaPhone, FaEnvelope, FaMapMarkerAlt
} from "react-icons/fa";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const COLORS = {
  primary: "#0d9488",
  primaryLight: "#ccfbf1",
  accent: "#14b8a6",
  info: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  surface: "#ffffff",
  dark: "#1e293b",
  rose: "#f43f5e",
  amber: "#d97706",
  emerald: "#059669",
  sky: "#0284c7"
};

const CHART_COLORS = [
  '#0d9488', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316'
];

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
function KpiCard({ label, value, icon, color, trend, trendValue }) {
  const isUp = trend === 'up';
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-slate-100 hover:border-teal-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs font-medium ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                  {trendValue}
                </span>
                <span className="text-[10px] text-slate-400">vs hier</span>
              </div>
            )}
          </div>
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}15`, color }}
          >
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pie Chart ─────────────────────────────────────────────────────────────
function PieChartComponent({ data, title, labels }) {
  const chartData = {
    labels: labels || ['Collecte', 'Lavage', 'Séchage', 'Stock', 'Autre'],
    datasets: [
      {
        data: data || [30, 25, 20, 15, 10],
        backgroundColor: CHART_COLORS.slice(0, 5),
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 10, weight: '500' },
          color: '#64748b'
        }
      }
    },
    cutout: '65%',
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white">
            <FaChartPie size={12} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">{title || 'Répartition'}</h3>
        </div>
        <div className="h-48">
          <Pie data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────
function BarChartComponent({ data, title, labels, colors }) {
  const chartData = {
    labels: labels || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Activité',
        data: data || [12, 19, 15, 22, 18, 14, 8],
        backgroundColor: colors || CHART_COLORS.slice(0, 7),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: {
          font: { size: 9 },
          color: '#94a3b8',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 9 },
          color: '#94a3b8',
        }
      }
    },
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white">
            <FaChartBar size={12} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">{title || 'Activité quotidienne'}</h3>
        </div>
        <div className="h-44">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Doughnut Chart ──────────────────────────────────────────────────────────
function DoughnutChartComponent({ data, title, labels }) {
  const chartData = {
    labels: labels || ['Disponible', 'En cours', 'Maintenance', 'HS'],
    datasets: [
      {
        data: data || [40, 30, 20, 10],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 9, weight: '500' },
          color: '#64748b'
        }
      }
    },
    cutout: '70%',
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white">
            <FaLayerGroup size={12} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">{title || 'État des machines'}</h3>
        </div>
        <div className="h-44">
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── STOCK SERVICES - Version élégante ─────────────────────────────────────
function StockServices({ services }) {
  if (!services || services.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-48">
          <p className="text-sm text-slate-400">Aucune donnée stock</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white">
            <FaWarehouse size={12} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Stock par service</h3>
            <p className="text-[10px] text-slate-400">{services.length} services suivis</p>
          </div>
          <Badge variant="outline" className="text-[8px] font-normal ml-auto bg-teal-50 text-teal-600 border-teal-200">
            En temps réel
          </Badge>
        </div>

        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {services.slice(0, 6).map((s, i) => {
            const total = s.nbTotal || 1;
            const livrePct = ((s.nbLivre || 0) / total) * 100;
            const circPct = ((s.nbEnCircuit || 0) / total) * 100;
            const stockPct = ((s.nbStocke || 0) / total) * 100;
            
            const statutConfig = {
              CRITIQUE: { color: COLORS.danger, bg: "#fee2e2", label: "⚠️ Critique", dot: COLORS.danger },
              ATTENTION: { color: COLORS.warning, bg: "#fef3c7", label: "⚡ Attention", dot: COLORS.warning },
              NORMAL: { color: COLORS.success, bg: "#dcfce7", label: "✓ Normal", dot: COLORS.success },
            }[s.statut] || { color: COLORS.muted, bg: "#f1f5f9", label: "—", dot: COLORS.muted };

            return (
              <div 
                key={i} 
                className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: statutConfig.bg }}>
                      <FaBuilding size={12} style={{ color: statutConfig.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{s.serviceCode}</span>
                    <span className="text-[9px] text-slate-400">{s.nbLivre || 0}/{total}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-medium" style={{ borderColor: statutConfig.color + '40', color: statutConfig.color, background: statutConfig.bg }}>
                    {statutConfig.label}
                  </Badge>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${Math.min(livrePct, 100)}%` }} />
                  <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${Math.min(circPct, 100)}%` }} />
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min(stockPct, 100)}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5 text-[8px] text-slate-400">
                  <span>🛏️ {s.nbLivre || 0} en place</span>
                  <span>🔄 {s.nbEnCircuit || 0} en circuit</span>
                  <span>📦 {s.nbStocke || 0} stock</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ALERTES - Version élégante ─────────────────────────────────────────────
function AlertesWidget({ alertes }) {
  const all = [
    ...(alertes?.stockCritique || []),
    ...(alertes?.sacsEnAttente || []),
    ...(alertes?.lingesBloqués || []).slice(0, 3),
    ...(alertes?.finDeVie || []).slice(0, 3),
  ];

  const isCritical = all.some(a => a.niveau === "CRITICAL");
  const nbCrit = all.filter(a => a.niveau === "CRITICAL").length;

  return (
    <Card className={`border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow ${isCritical ? 'border-red-200' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
            <FaBell className={isCritical ? "text-red-500" : "text-amber-500"} size={14} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Alertes</h3>
            <p className="text-[10px] text-slate-400">{all.length} alerte{all.length > 1 ? 's' : ''} active{all.length > 1 ? 's' : ''}</p>
          </div>
          {nbCrit > 0 && (
            <Badge variant="destructive" className="text-[8px] font-normal ml-auto">
              {nbCrit} critique{nbCrit > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {all.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600">Tout est sous contrôle</p>
            <p className="text-xs text-slate-400">Aucune alerte en cours</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {all.slice(0, 5).map((a, i) => {
              const isCrit = a.niveau === "CRITICAL";
              return (
                <div 
                  key={i}
                  className="p-3 rounded-xl bg-white border hover:shadow-sm transition-all"
                  style={{ borderLeft: `3px solid ${isCrit ? COLORS.danger : COLORS.warning}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isCrit ? 'bg-red-50' : 'bg-amber-50'}`}>
                        {a.type?.includes("SAC") ? <FaBiohazard className={isCrit ? "text-red-500" : "text-amber-500"} size={10} /> : 
                         a.type?.includes("FIN") ? <FaClock className="text-amber-500" size={10} /> :
                         <FaExclamationTriangle className={isCrit ? "text-red-500" : "text-amber-500"} size={10} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{a.message}</p>
                      {a.detail && <p className="text-[9px] text-slate-400 mt-0.5">{a.detail}</p>}
                    </div>
                    {a.reference && (
                      <code className="text-[9px] font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-500 flex-shrink-0">
                        {a.reference}
                      </code>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── COLLECTES - Version élégante ──────────────────────────────────────────
function CollectesRecentes({ collectes }) {
  const typeIcon = { MIXTE: "🏢", CHAMBRE: "🏠", UNIFORME: "👔" };
  const typeColor = { MIXTE: "#8b5cf6", CHAMBRE: "#0d9488", UNIFORME: "#0ea5e9" };
  const typeBg = { MIXTE: "#f5f3ff", CHAMBRE: "#ccfbf1", UNIFORME: "#e0f2fe" };

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white">
            <FaTruck size={12} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Collectes récentes</h3>
            <p className="text-[10px] text-slate-400">Dernières opérations</p>
          </div>
          <Badge variant="outline" className="text-[8px] font-normal ml-auto bg-purple-50 text-purple-600 border-purple-200">
            {collectes.length}
          </Badge>
        </div>

        {collectes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400">Aucune collecte récente</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {collectes.map((c, i) => {
              const total = (c.nbBlancs || 0) + (c.nbInfectes || 0) + (c.nbPropres || 0) + (c.nbManquants || 0);
              const color = typeColor[c.typeCollecte] || '#64748b';
              const bg = typeBg[c.typeCollecte] || '#f1f5f9';
              
              return (
                <div 
                  key={i} 
                  className="p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all flex items-center gap-3"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: bg }}
                  >
                    {typeIcon[c.typeCollecte] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {c.serviceCode || c.codeChambre || c.agentNom || c.numeroCollecte}
                      </p>
                      <span className="text-[8px] font-medium px-1.5 py-0.5 rounded" style={{ background: bg, color }}>
                        {c.typeCollecte || '—'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      {c.agentNom} · {c.dateCollecte ? new Date(c.dateCollecte).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  {total > 0 && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color }}>{total}</span>
                      <span className="text-[8px] text-slate-400 block">linges</span>
                    </div>
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

// ─── AGENTS - Version élégante ─────────────────────────────────────────────
function AgentsActifs({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-48">
          <p className="text-sm text-slate-400">Aucun agent actif</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white">
            <FaUsers size={12} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Agents actifs</h3>
            <p className="text-[10px] text-slate-400">{agents.length} agents en activité</p>
          </div>
          <Badge variant="outline" className="text-[8px] font-normal ml-auto bg-pink-50 text-pink-600 border-pink-200">
            Aujourd'hui
          </Badge>
        </div>

        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {agents.slice(0, 5).map((a, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-pink-200 hover:shadow-sm transition-all"
            >
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}
              >
                {a.nomComplet?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{a.nomComplet}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all rounded-full"
                      style={{ width: `${Math.min((a.nbOperations / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-teal-600 flex-shrink-0">{a.nbOperations}</span>
                </div>
              </div>
              {a.etapeActive && (
                <Badge variant="outline" className="text-[7px] font-medium bg-teal-50 text-teal-600 border-teal-200 flex-shrink-0">
                  {a.etapeActive}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MACHINES - Version élégante ────────────────────────────────────────────
function Machines({ machines }) {
  if (!machines || machines.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-48">
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
    <Card className="border-slate-100 h-full shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white">
            <FaWrench size={12} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Machines</h3>
            <p className="text-[10px] text-slate-400">{machines.filter(m => m.etat === "EN_COURS").length}/{machines.length} en cours</p>
          </div>
          <Badge variant="outline" className="text-[8px] font-normal ml-auto bg-amber-50 text-amber-600 border-amber-200">
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {machines.slice(0, 4).map((m, i) => {
            const e = etatConfig[m.etat] || { bg: "#f1f5f9", color: COLORS.muted, dot: COLORS.muted, label: m.etat };
            return (
              <div 
                key={i}
                className="p-3 rounded-xl bg-white border hover:shadow-md transition-all"
                style={{ borderLeft: `3px solid ${e.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{typeIcon[m.type] || "⚙️"}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: e.dot }} />
                    <span className="text-[8px] font-medium" style={{ color: e.color }}>{e.label}</span>
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">{m.code}</p>
                <div className="flex gap-2 mt-2 text-[9px]">
                  <div className="bg-slate-50 rounded-lg px-2 py-1 flex-1 text-center">
                    <span className="font-bold text-slate-700">{m.cyclesAujourdhui || 0}</span>
                    <span className="text-slate-400 block text-[7px]">cycles</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-1 flex-1 text-center">
                    <span className="font-bold text-slate-700">{m.poidsTraiteAujourdhui || 0}</span>
                    <span className="text-slate-400 block text-[7px]">kg</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const num = (n) => (n ?? 0).toLocaleString("fr-FR");
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────
export default function BuanderieStats() {
  const { data, loading, error, lastUpdate, refresh } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const kpis = data?.kpis || {};
  const dist = data?.dist || {};
  const machines = data?.machines || [];

  const pieData = Object.entries(dist).map(([key, value]) => ({
    label: ETATS[key]?.label || key,
    value: value || 0
  })).filter(d => d.value > 0);

  const pieLabels = pieData.map(d => d.label);
  const pieValues = pieData.map(d => d.value);

  const barData = [12, 19, 15, 22, 18, 14, 8];
  const barLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const machinesData = [
    machines.filter(m => m.etat === "DISPONIBLE").length || 0,
    machines.filter(m => m.etat === "EN_COURS").length || 0,
    machines.filter(m => m.etat === "EN_MAINTENANCE").length || 0,
    machines.filter(m => m.etat === "HORS_SERVICE").length || 0,
  ];

  return (
    <div >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <FaTshirt size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Buanderie Hospitalière</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-400'}`} />
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
          className="text-xs gap-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
        >
          <FaSync className={isRefreshing ? 'animate-spin' : ''} size={12} />
          Actualiser
        </Button>
      </div>

      {/* ─── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
          <FaExclamationTriangle size={16} />
          {error}
        </div>
      )}

      {/* ─── KPI ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Linges actifs" value={num(kpis.lingesActifs)} icon="🧺" color={COLORS.primary} trend="up" trendValue="+12%" />
        <KpiCard label="Disponibles" value={num(kpis.lingesDisponibles)} icon="📦" color={COLORS.success} trend="up" trendValue="+5%" />
        <KpiCard label="En circuit" value={num(kpis.lingesEnCircuit)} icon="🔄" color={COLORS.info} trend="down" trendValue="-3%" />
        <KpiCard label="Collectes" value={num(kpis.collectesAujourdhui)} icon="🚚" color={COLORS.purple} />
        <KpiCard label="Lavages" value={num(kpis.lavagesAujourdhui)} icon="🫧" color="#3b82f6" />
        <KpiCard label="Sacs infectés" value={num(kpis.sacsInfectesEnAttente)} icon="⚠️" color={COLORS.warning} />
        <KpiCard label="Fin de vie" value={num(kpis.lingesProcheFin)} icon="🔴" color={COLORS.danger} />
        <KpiCard label="Taux infection" value={kpis.tauxInfectionMois != null ? `${kpis.tauxInfectionMois}%` : '—'} icon="🦠" color={COLORS.warning} />
      </div>

      {/* ─── Graphiques ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <BarChartComponent 
            data={barData} 
            labels={barLabels}
            title="Activité quotidienne"
          />
        </div>
        <div>
          <PieChartComponent 
            data={pieValues.length > 0 ? pieValues : [30, 25, 20, 15, 10]}
            labels={pieLabels.length > 0 ? pieLabels : ['Collecte', 'Lavage', 'Séchage', 'Stock', 'Autre']}
            title="Répartition des linges"
          />
        </div>
      </div>

      {/* ─── Grille secondaire élégante ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stock - 4 colonnes */}
        <div className="lg:col-span-4">
          <StockServices services={data?.stock || []} />
        </div>

        {/* Machines + Doughnut - 4 colonnes */}
        <div className="lg:col-span-4 space-y-4">
          <Machines machines={machines} />
          <DoughnutChartComponent 
            data={machinesData.length > 0 ? machinesData : [40, 30, 20, 10]}
            labels={['Disponible', 'En cours', 'Maintenance', 'HS']}
            title="État des machines"
          />
        </div>

        {/* Alertes + Collectes + Agents - 4 colonnes */}
        <div className="lg:col-span-4 space-y-4">
          <AlertesWidget alertes={data?.alertes || {}} />
          <CollectesRecentes collectes={data?.collectes || []} />
          <AgentsActifs agents={data?.agents || []} />
        </div>
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
        <span>🔄 Mise à jour automatique · 30 secondes</span>
        <span>
          📊 {num(kpis.totalLinges)} linges total · 
          ⚙️ {pct(kpis.tauxOccupationMachines, 100)}% machines en cours · 
          📈 {kpis.tauxInfectionMois || 0}% infection
        </span>
      </div>
    </div>
  );
}