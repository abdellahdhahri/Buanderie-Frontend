import React, { useState, useEffect, useCallback } from "react";
import {
  FaSync, FaBell, FaArrowUp, FaArrowDown,
  FaTshirt, FaTruck,
  FaBiohazard, FaExclamationTriangle,
  FaCheckCircle, FaClock,
  FaWarehouse, FaUsers, FaWrench,
  FaChartPie, FaChartBar,
  FaLayerGroup,
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
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

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
  success: "#10b981",
  info: "#0ea5e9",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
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

// ─── HOOK ──────────────────────────────────────────────────────────────────
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

// ─── KPI CARD ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, trend, trendValue }) {
  const isUp = trend === 'up';
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-slate-100 hover:border-teal-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-medium ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUp ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                  {trendValue}
                </span>
                <span className="text-[8px] text-slate-400">vs hier</span>
              </div>
            )}
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

// ─── PIE CHART ─────────────────────────────────────────────────────────────
function PieChartComponent({ data, title, labels }) {
  const chartData = {
    labels: labels || ['Collecte', 'Lavage', 'Séchage', 'Stock', 'Autre'],
    datasets: [
      {
        data: data || [30, 25, 20, 15, 10],
        backgroundColor: CHART_COLORS.slice(0, 5),
        borderColor: '#ffffff',
        borderWidth: 2,
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
          padding: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 9, weight: '500' },
          color: '#64748b'
        }
      }
    },
    cutout: '65%',
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white">
            <FaChartPie size={11} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">{title || 'Répartition'}</h3>
        </div>
        <div className="h-[180px]">
          <Pie data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BAR CHART ─────────────────────────────────────────────────────────────
function BarChartComponent({ data, title, labels }) {
  const chartData = {
    labels: labels || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Activité',
        data: data || [12, 19, 15, 22, 18, 14, 8],
        backgroundColor: CHART_COLORS.slice(0, 7),
        borderRadius: 4,
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
          font: { size: 8 },
          color: '#94a3b8',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 8 },
          color: '#94a3b8',
        }
      }
    },
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white">
            <FaChartBar size={11} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">{title || 'Activité quotidienne'}</h3>
        </div>
        <div className="h-[180px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── STOCK PAR SERVICE ─────────────────────────────────────────────────────
function StockServices({ services }) {
  if (!services || services.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-6 text-center">
          <FaWarehouse className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Aucune donnée stock</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            <FaWarehouse size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">Stock par service</h3>
          <Badge className="ml-auto bg-teal-50 text-teal-700 text-[9px] px-2 py-0.5">
            {services.length}
          </Badge>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {services.map((s, i) => {
            const total = s.nbTotal || 1;
            const enPlace = s.nbLivre || 0;
            const enCircuit = s.nbEnCircuit || 0;
            const stocke = s.nbStocke || 0;

            return (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-700">{s.serviceCode || "N/A"}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-teal-600 font-medium">{enPlace}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-500">{total}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(enPlace / total) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-1.5 text-[10px] text-slate-400">
                  <span>📦 {enPlace} en place</span>
                  <span>🔄 {enCircuit} circuit</span>
                  <span>📥 {stocke} stock</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ÉTAT DES MACHINES ─────────────────────────────────────────────────────
function EtatMachines({ machines }) {
  if (!machines || machines.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 text-center py-6">
          <FaWrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune machine</p>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    DISPONIBLE: machines.filter(m => m.etat === "DISPONIBLE").length,
    EN_COURS: machines.filter(m => m.etat === "EN_COURS").length,
    EN_MAINTENANCE: machines.filter(m => m.etat === "EN_MAINTENANCE").length,
    HORS_SERVICE: machines.filter(m => m.etat === "HORS_SERVICE").length,
  };

  const total = machines.length;

  const etatConfig = {
    DISPONIBLE: { color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Disponible", icon: "🟢", barColor: "#10b981" },
    EN_COURS: { color: "blue", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "En cours", icon: "🔵", barColor: "#3b82f6" },
    EN_MAINTENANCE: { color: "amber", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Maintenance", icon: "🟡", barColor: "#f59e0b" },
    HORS_SERVICE: { color: "red", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Hors service", icon: "🔴", barColor: "#ef4444" },
  };

  const typeIcon = {
    LAVEUR: '🫧',
    SECHEUR: '🌬️',
    LAVEUR_SECHEUR: '🔁'
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white">
            <FaWrench size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">État des machines</h3>
          <Badge className="ml-auto bg-amber-50 text-amber-700 text-[9px] px-2 py-0.5">
            {total} machines
          </Badge>
        </div>

        {/* Barres de progression */}
        <div className="space-y-2 mb-4">
          {Object.entries(etatConfig).map(([key, config]) => {
            const count = stats[key] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (count === 0) return null;

            return (
              <div key={key}>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">{config.icon}</span>
                    <span className="font-medium text-slate-600">{config.label}</span>
                  </span>
                  <span className="font-bold text-slate-700">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: config.barColor
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille des machines */}
        <div className="grid grid-cols-2 gap-2">
          {machines.slice(0, 4).map((m, i) => {
            const e = etatConfig[m.etat] || { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", label: m.etat || "Inconnu", icon: "⚪" };
            const icon = typeIcon[m.type] || '⚙️';
            
            return (
              <div key={i} className={`p-2.5 rounded-lg ${e.bg} border border-slate-100`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-mono font-semibold text-slate-700">{m.code || "N/A"}</span>
                  </div>
                  <span className={`text-[9px] font-medium ${e.text} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                    {e.label}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                  <span>🔄 {m.cyclesAujourdhui || 0} cycles</span>
                  <span>⚖️ {m.poidsTraiteAujourdhui || 0} kg</span>
                </div>
              </div>
            );
          })}
        </div>

        {machines.length > 4 && (
          <p className="text-[10px] text-slate-400 text-center mt-2.5">
            + {machines.length - 4} autre{machines.length - 4 > 1 ? 's' : ''} machine{machines.length - 4 > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── RÉPARTITION DES MACHINES ─────────────────────────────────────────────
function RepartitionMachines({ machines }) {
  if (!machines || machines.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 text-center py-6">
          <FaLayerGroup className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune machine</p>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    DISPONIBLE: machines.filter(m => m.etat === "DISPONIBLE").length,
    EN_COURS: machines.filter(m => m.etat === "EN_COURS").length,
    EN_MAINTENANCE: machines.filter(m => m.etat === "EN_MAINTENANCE").length,
    HORS_SERVICE: machines.filter(m => m.etat === "HORS_SERVICE").length,
  };

  const total = machines.length;

  const chartData = {
    labels: ['Disponible', 'En cours', 'Maintenance', 'Hors service'],
    datasets: [
      {
        data: [stats.DISPONIBLE, stats.EN_COURS, stats.EN_MAINTENANCE, stats.HORS_SERVICE],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 2,
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
          padding: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 9, weight: '500' },
          color: '#64748b'
        }
      }
    },
    cutout: '65%',
  };

  const etatList = [
    { key: 'DISPONIBLE', label: 'Disponible', icon: '🟢', count: stats.DISPONIBLE, color: '#10b981', bg: 'bg-emerald-50' },
    { key: 'EN_COURS', label: 'En cours', icon: '🔵', count: stats.EN_COURS, color: '#3b82f6', bg: 'bg-blue-50' },
    { key: 'EN_MAINTENANCE', label: 'Maintenance', icon: '🟡', count: stats.EN_MAINTENANCE, color: '#f59e0b', bg: 'bg-amber-50' },
    { key: 'HORS_SERVICE', label: 'Hors service', icon: '🔴', count: stats.HORS_SERVICE, color: '#ef4444', bg: 'bg-red-50' },
  ];

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white">
            <FaLayerGroup size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">Répartition des machines</h3>
          <Badge className="ml-auto bg-purple-50 text-purple-700 text-[9px] px-2 py-0.5">
            {total} machines
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Graphique Doughnut */}
          <div className="h-[200px]">
            <Doughnut data={chartData} options={options} />
          </div>

          {/* Légende détaillée avec compteurs */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {etatList.map((item) => (
              <div 
                key={item.key}
                className={`p-2.5 rounded-lg ${item.bg} border border-slate-100`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: item.color }}>
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ALERTES ───────────────────────────────────────────────────────────────
function AlertesWidget({ alertes }) {
  const all = [
    ...(alertes?.stockCritique || []),
    ...(alertes?.sacsEnAttente || []),
    ...(alertes?.lingesBloqués || []).slice(0, 3),
    ...(alertes?.finDeVie || []).slice(0, 3),
  ];

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white">
            <FaBell size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">Alertes</h3>
          {all.length > 0 && (
            <Badge className="ml-auto bg-red-100 text-red-700 text-[9px] px-2 py-0.5">
              {all.length}
            </Badge>
          )}
        </div>

        {all.length === 0 ? (
          <div className="text-center py-6">
            <FaCheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Tout est sous contrôle</p>
            <p className="text-xs text-slate-400">Aucune alerte en cours</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {all.slice(0, 5).map((a, i) => {
              const isCrit = a.niveau === "CRITICAL";
              return (
                <div key={i} className={`p-2.5 rounded-lg ${isCrit ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{isCrit ? '🔴' : '⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{a.message || "Alerte"}</p>
                      {a.detail && <p className="text-[10px] text-slate-500 truncate">{a.detail}</p>}
                    </div>
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

// ─── COLLECTES RÉCENTES ────────────────────────────────────────────────────
function CollectesRecentes({ collectes }) {
  if (!collectes || collectes.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 text-center py-6">
          <FaTruck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune collecte récente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center text-white">
            <FaTruck size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">Collectes récentes</h3>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto">
          {collectes.map((c, i) => {
            const total = (c.nbBlancs || 0) + (c.nbInfectes || 0) + (c.nbPropres || 0) + (c.nbManquants || 0);
            return (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.serviceCode || c.codeChambre || "Collecte"}</p>
                  <p className="text-[10px] text-slate-400">
                    {c.agentNom || "Agent"} · {c.dateCollecte ? new Date(c.dateCollecte).toLocaleDateString("fr-FR") : "—"}
                  </p>
                </div>
                {total > 0 && (
                  <Badge className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5">
                    {total} linges
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AGENTS ACTIFS ─────────────────────────────────────────────────────────
function AgentsActifs({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-4 text-center py-6">
          <FaUsers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucun agent actif</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center text-white">
            <FaUsers size={12} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">Agents actifs</h3>
          <Badge className="ml-auto bg-pink-50 text-pink-700 text-[9px] px-2 py-0.5">
            {agents.length}
          </Badge>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto">
          {agents.slice(0, 5).map((a, i) => {
            const initials = a.nomComplet?.split(" ").map(n => n[0]).join("").slice(0, 2) || "??";
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{a.nomComplet || "Agent"}</p>
                  {a.etapeActive && (
                    <p className="text-[10px] text-slate-400 truncate">{a.etapeActive}</p>
                  )}
                </div>
                <Badge className="bg-teal-50 text-teal-700 text-[10px] px-2 py-0.5">
                  {a.nbOperations || 0} op.
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── FONCTIONS UTILITAIRES ────────────────────────────────────────────────
const num = (n) => (n ?? 0).toLocaleString("fr-FR");

// ─── PAGE PRINCIPALE ───────────────────────────────────────────────────────
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

  return (
    <div className="p-6">
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <FaTshirt size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
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
          className="text-[10px] gap-1.5 border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all h-8"
        >
          <FaSync className={isRefreshing ? 'animate-spin' : ''} size={10} />
          Actualiser
        </Button>
      </div>

      {/* ─── ERREUR ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <FaExclamationTriangle size={12} />
          {error}
        </div>
      )}

      {/* ─── KPI ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Linges actifs" value={num(kpis.lingesActifs)} icon="🧺" color={COLORS.primary} trend="up" trendValue="+12%" />
        <KpiCard label="Disponibles" value={num(kpis.lingesDisponibles)} icon="📦" color={COLORS.success} trend="up" trendValue="+5%" />
        <KpiCard label="En circuit" value={num(kpis.lingesEnCircuit)} icon="🔄" color={COLORS.info} trend="down" trendValue="-3%" />
        <KpiCard label="Collectes" value={num(kpis.collectesAujourdhui)} icon="🚚" color={COLORS.purple} />
        <KpiCard label="Lavages" value={num(kpis.lavagesAujourdhui)} icon="🫧" color="#3b82f6" />
        <KpiCard label="Sacs infectés" value={num(kpis.sacsInfectesEnAttente)} icon="⚠️" color={COLORS.warning} />
        <KpiCard label="Fin de vie" value={num(kpis.lingesProcheFin)} icon="🔴" color={COLORS.danger} />
        <KpiCard label="Taux infection" value={kpis.tauxInfectionMois != null ? `${kpis.tauxInfectionMois}%` : '—'} icon="🦠" color={COLORS.warning} />
      </div>

      {/* ─── GRAPHIQUES ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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

      {/* ─── GRILLE SECONDAIRE ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock par service */}
        <div>
          <StockServices services={data?.stock || []} />
        </div>

        {/* Machines + État */}
        <div className="space-y-4">
          <EtatMachines machines={machines} />
          <RepartitionMachines machines={machines} />
        </div>

        {/* Alertes, Collectes, Agents */}
        <div className="space-y-4">
          <AlertesWidget alertes={data?.alertes || {}} />
          <CollectesRecentes collectes={data?.collectes || []} />
          <AgentsActifs agents={data?.agents || []} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[8px] text-slate-400">
        <span>🔄 Mise à jour automatique · 30s</span>
        <span>
          📊 {num(kpis.totalLinges)} linges ·
          ⚙️ {kpis.tauxOccupationMachines || 0}% machines ·
          📈 {kpis.tauxInfectionMois || 0}% infection
        </span>
      </div>
    </div>
  );
}