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
  FaUserCheck, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaArrowRight, FaList, FaTh
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
  dark: "#1e293b"
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

// ─── Pie Chart ─────────────────────────────────────────────────────────────
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

// ─── Bar Chart ─────────────────────────────────────────────────────────────
function BarChartComponent({ data, title, labels, colors }) {
  const chartData = {
    labels: labels || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Activité',
        data: data || [12, 19, 15, 22, 18, 14, 8],
        backgroundColor: colors || CHART_COLORS.slice(0, 7),
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

// ─── Doughnut Chart ────────────────────────────────────────────────────────
function DoughnutChartComponent({ data, title, labels }) {
  const chartData = {
    labels: labels || ['Disponible', 'En cours', 'Maintenance', 'HS'],
    datasets: [
      {
        data: data || [40, 30, 20, 10],
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
          font: { size: 8, weight: '500' },
          color: '#64748b'
        }
      }
    },
    cutout: '70%',
  };

  return (
    <Card className="border-slate-100 h-full shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white">
            <FaLayerGroup size={11} />
          </div>
          <h3 className="text-xs font-bold text-slate-700">{title || 'État des machines'}</h3>
        </div>
        <div className="h-[180px]">
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── STOCK SERVICES (moderne) ──────────────────────────────────────────────
function StockServices({ services }) {
  if (!services || services.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-[240px]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FaWarehouse className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Aucune donnée stock</p>
            <p className="text-xs text-slate-400 mt-1">Les services apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLivre = services.reduce((sum, s) => sum + (s.nbLivre || 0), 0);
  const totalCircuit = services.reduce((sum, s) => sum + (s.nbEnCircuit || 0), 0);
  const totalStock = services.reduce((sum, s) => sum + (s.nbStocke || 0), 0);

  return (
    <Card className="border-slate-100 h-full shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-4 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <FaWarehouse size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Stock par service</h3>
                <p className="text-xs text-slate-400">{services.length} services suivis</p>
              </div>
            </div>
            <Badge className="bg-teal-50 text-teal-700 border-0 text-[10px] font-medium px-2.5 py-0.5">
              Live
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-teal-50/80 border border-teal-100 p-2.5 text-center">
              <p className="text-lg font-bold text-teal-700 leading-none">{totalLivre}</p>
              <p className="text-[10px] text-teal-600/80 mt-1 font-medium">En place</p>
            </div>
            <div className="rounded-xl bg-sky-50/80 border border-sky-100 p-2.5 text-center">
              <p className="text-lg font-bold text-sky-700 leading-none">{totalCircuit}</p>
              <p className="text-[10px] text-sky-600/80 mt-1 font-medium">En circuit</p>
            </div>
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-700 leading-none">{totalStock}</p>
              <p className="text-[10px] text-emerald-600/80 mt-1 font-medium">Stock</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 max-h-[220px] overflow-y-auto">
          {services.slice(0, 6).map((s, i) => {
            const total = s.nbTotal || 1;
            const livrePct = ((s.nbLivre || 0) / total) * 100;
            const circPct = ((s.nbEnCircuit || 0) / total) * 100;

            const statutConfig = {
              CRITIQUE: { color: "bg-red-500", text: "text-red-600", bg: "bg-red-50", label: "Critique" },
              ATTENTION: { color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "Attention" },
              NORMAL: { color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", label: "Normal" },
            }[s.statut] || { color: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50", label: "—" };

            return (
              <div
                key={i}
                className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${statutConfig.color}`} />
                    <span className="text-sm font-semibold text-slate-800">{s.serviceCode || "N/A"}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${statutConfig.bg} ${statutConfig.text}`}>
                      {statutConfig.label}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    <span className="text-slate-800 font-bold">{s.nbLivre || 0}</span>
                    <span className="text-slate-300 mx-1">/</span>
                    {total}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(livrePct, 100)}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-300 transition-all duration-500"
                    style={{ width: `${Math.min(circPct, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> En place
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Circuit
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {services.length > 6 && (
          <div className="px-4 pb-3">
            <p className="text-[11px] text-slate-400 text-center py-1.5 rounded-lg bg-slate-50">
              + {services.length - 6} autres services
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ALERTES (moderne) ─────────────────────────────────────────────────────
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
    <Card className={`border-slate-100 h-full shadow-sm overflow-hidden ${isCritical ? "ring-1 ring-red-200" : ""}`}>
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCritical ? "bg-red-100" : "bg-amber-100"}`}>
              <FaBell className={isCritical ? "text-red-500" : "text-amber-500"} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Alertes</h3>
              <p className="text-xs text-slate-400">
                {all.length === 0 ? "Aucune alerte" : `${all.length} active${all.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {nbCrit > 0 && (
            <Badge className="bg-red-500 text-white border-0 text-[10px] font-semibold px-2.5 py-0.5 shadow-sm shadow-red-200">
              {nbCrit} critique{nbCrit > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {all.length === 0 ? (
          <div className="px-5 pb-6 pt-2 flex items-center justify-center">
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tout est sous contrôle</p>
              <p className="text-xs text-slate-400 mt-1">Aucune alerte en cours</p>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2 max-h-[180px] overflow-y-auto">
            {all.slice(0, 5).map((a, i) => {
              const isCrit = a.niveau === "CRITICAL";
              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                    isCrit
                      ? "bg-red-50/50 border-red-100 hover:border-red-200"
                      : "bg-amber-50/40 border-amber-100 hover:border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCrit ? "bg-red-100" : "bg-amber-100"
                    }`}>
                      {a.type?.includes("SAC") ? (
                        <FaBiohazard size={13} className={isCrit ? "text-red-500" : "text-amber-500"} />
                      ) : a.type?.includes("FIN") ? (
                        <FaClock size={13} className="text-amber-500" />
                      ) : (
                        <FaExclamationTriangle size={13} className={isCrit ? "text-red-500" : "text-amber-500"} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{a.message || "Alerte"}</p>
                      {a.detail && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.detail}</p>
                      )}
                    </div>
                    {a.reference && (
                      <code className="text-[10px] font-mono bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500 flex-shrink-0">
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

// ─── COLLECTES RÉCENTES (moderne) ──────────────────────────────────────────
function CollectesRecentes({ collectes }) {
  const typeConfig = {
    MIXTE: { icon: "🏢", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    CHAMBRE: { icon: "🏠", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
    UNIFORME: { icon: "👔", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  };

  if (!collectes || collectes.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-[200px]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FaTruck className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Aucune collecte récente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 h-full shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <FaTruck size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Collectes récentes</h3>
              <p className="text-xs text-slate-400">Dernières opérations</p>
            </div>
          </div>
          <Badge className="bg-violet-50 text-violet-700 border-0 text-[10px] font-medium px-2.5 py-0.5">
            {collectes.length}
          </Badge>
        </div>

        <div className="px-4 pb-4 space-y-2 max-h-[180px] overflow-y-auto">
          {collectes.map((c, i) => {
            const total = (c.nbBlancs || 0) + (c.nbInfectes || 0) + (c.nbPropres || 0) + (c.nbManquants || 0);
            const conf = typeConfig[c.typeCollecte] || { icon: "📦", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" };

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center text-lg flex-shrink-0`}>
                  {conf.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {c.serviceCode || c.codeChambre || "Collecte"}
                    </p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${conf.bg} ${conf.color}`}>
                      {c.typeCollecte || "—"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {c.agentNom || "Agent"} · {c.dateCollecte ? new Date(c.dateCollecte).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
                  </p>
                </div>
                {total > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${conf.color}`}>{total}</p>
                    <p className="text-[10px] text-slate-400">linges</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AGENTS ACTIFS (moderne) ───────────────────────────────────────────────
function AgentsActifs({ agents }) {
  if (!agents || agents.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-[200px]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FaUsers className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Aucun agent actif</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxOps = Math.max(...agents.map(x => x.nbOperations || 0), 1);

  return (
    <Card className="border-slate-100 h-full shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <FaUsers size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Agents actifs</h3>
              <p className="text-xs text-slate-400">{agents.length} en activité</p>
            </div>
          </div>
          <Badge className="bg-pink-50 text-pink-700 border-0 text-[10px] font-medium px-2.5 py-0.5">
            Aujourd'hui
          </Badge>
        </div>

        <div className="px-4 pb-4 space-y-2.5 max-h-[180px] overflow-y-auto">
          {agents.slice(0, 5).map((a, i) => {
            const pct = ((a.nbOperations || 0) / maxOps) * 100;
            const initials = a.nomComplet?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-pink-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.nomComplet || "Agent"}</p>
                    <span className="text-xs font-bold text-teal-600 flex-shrink-0">{a.nbOperations || 0}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {a.etapeActive && (
                    <p className="text-[10px] text-slate-400 mt-1 truncate">{a.etapeActive}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MACHINES (moderne) ────────────────────────────────────────────────────
function Machines({ machines }) {
  if (!machines || machines.length === 0) {
    return (
      <Card className="border-slate-100 h-full shadow-sm">
        <CardContent className="p-5 flex items-center justify-center h-[200px]">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FaWrench className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Aucune machine</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const etatConfig = {
    EN_COURS: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500", label: "En cours" },
    DISPONIBLE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Disponible" },
    EN_MAINTENANCE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Maintenance" },
    HORS_SERVICE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Hors service" },
  };

  const typeIcon = { LAVEUR: "🫧", SECHEUR: "🌬️", LAVEUR_SECHEUR: "🔁" };
  const total = machines.length;
  const enCours = machines.filter(m => m.etat === "EN_COURS").length;

  return (
    <Card className="border-slate-100 h-full shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <FaWrench size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Machines</h3>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-amber-600">{enCours}</span> / {total} en cours
              </p>
            </div>
          </div>
          <Badge className="bg-amber-50 text-amber-700 border-0 text-[10px] font-medium px-2.5 py-0.5">
            Live
          </Badge>
        </div>

        <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
          {machines.slice(0, 4).map((m, i) => {
            const e = etatConfig[m.etat] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", label: m.etat };

            return (
              <div
                key={i}
                className={`p-3 rounded-xl border ${e.border} ${e.bg} hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{typeIcon[m.type] || "⚙️"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${e.dot} ${m.etat === "EN_COURS" ? "animate-pulse" : ""}`} />
                    <span className={`text-[10px] font-semibold ${e.text}`}>{e.label}</span>
                  </div>
                </div>

                <p className="text-sm font-bold font-mono text-slate-800">{m.code || "N/A"}</p>

                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  <div className="bg-white/70 rounded-lg px-2 py-1.5 text-center border border-white/50">
                    <p className="text-sm font-bold text-slate-800 leading-none">{m.cyclesAujourdhui || 0}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">cycles</p>
                  </div>
                  <div className="bg-white/70 rounded-lg px-2 py-1.5 text-center border border-white/50">
                    <p className="text-sm font-bold text-slate-800 leading-none">{m.poidsTraiteAujourdhui || 0}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">kg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {machines.length > 4 && (
          <div className="px-4 pb-3">
            <p className="text-[11px] text-slate-400 text-center py-1.5 rounded-lg bg-slate-50">
              + {machines.length - 4} autres machines
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Fonctions utilitaires ─────────────────────────────────────────────────
const num = (n) => (n ?? 0).toLocaleString("fr-FR");
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";

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

  const machinesData = [
    machines.filter(m => m.etat === "DISPONIBLE").length || 0,
    machines.filter(m => m.etat === "EN_COURS").length || 0,
    machines.filter(m => m.etat === "EN_MAINTENANCE").length || 0,
    machines.filter(m => m.etat === "HORS_SERVICE").length || 0,
  ];

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <FaTshirt size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Buanderie Hospitalière</h1>
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

      {/* ─── Erreur ─────────────────────────────────────────────────────── */}
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

      {/* ─── Graphiques ─────────────────────────────────────────────────── */}
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

      {/* ─── Grille secondaire ──────────────────────────────────────────── */}
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

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[8px] text-slate-400">
        <span>🔄 Mise à jour automatique · 30s</span>
        <span>
          📊 {num(kpis.totalLinges)} linges ·
          ⚙️ {pct(kpis.tauxOccupationMachines, 100)}% machines ·
          📈 {kpis.tauxInfectionMois || 0}% infection
        </span>
      </div>
    </div>
  );
}