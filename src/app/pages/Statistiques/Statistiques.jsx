import React, { useContext, useEffect, useState, useMemo } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import { useNavigate } from "react-router-dom";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { 
  FaChartBar, FaBoxes, FaSoap, FaWind, FaCheckDouble, 
  FaExclamationTriangle, FaArrowLeft, FaWeightHanging 
} from "react-icons/fa";
import "./Statistiques.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ef4444"];

export default function Statistiques() {
  const { linges } = useContext(LingeContext);
  const navigate = useNavigate();
  const [reclamations, setReclamations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/reclamations")
      .then(res => res.json())
      .then(data => setReclamations(data))
      .catch(err => console.error("Error fetching reclamations:", err));
  }, []);

  // 🔹 Calcul des données pour le Pie Chart (États)
  const stateData = useMemo(() => {
    const counts = {};
    linges.forEach(l => {
      counts[l.etat] = (counts[l.etat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.replace(/_/g, " "), 
      value 
    }));
  }, [linges]);

  // 🔹 Calcul des données pour le Bar Chart (Catégories)
  const categoryData = useMemo(() => {
    const counts = {};
    linges.forEach(l => {
      counts[l.categorie] = (counts[l.categorie] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [linges]);

  const recStatusData = useMemo(() => {
    const counts = { OUVERTE: 0, EN_COURS: 0, RESOLUE: 0 };
    reclamations.forEach(r => {
      if (counts[r.statut] !== undefined) counts[r.statut]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reclamations]);

  // 🔹 KPIs
  const totalLinge = linges.length;
  const totalWeight = linges.reduce((acc, l) => acc + (parseFloat(l.poids) || 0), 0).toFixed(1);
  const enLavage = linges.filter(l => l.etat === "EN_LAVAGE").length;
  const manquants = linges.filter(l => l.etat === "MANQUANT").length;
  const enStock = linges.filter(l => l.etat === "STOCKE").length;
  const recOuvertes = reclamations.filter(r => r.statut === "OUVERTE").length;

  return (
    <div className="stats-page">
    

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><FaBoxes /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Articles</span>
            <span className="kpi-value">{totalLinge}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><FaWeightHanging /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Manquants</span>
            <span className="kpi-value">{manquants}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><FaSoap /></div>
          <div className="kpi-content">
            <span className="kpi-label">En Lavage</span>
            <span className="kpi-value">{enLavage}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><FaCheckDouble /></div>
          <div className="kpi-content">
            <span className="kpi-label">En Stock</span>
            <span className="kpi-value">{enStock}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><FaExclamationTriangle /></div>
          <div className="kpi-content">
            <span className="kpi-label">Réclamations</span>
            <span className="kpi-value">{recOuvertes}</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3><FaChartBar /> Répartition par État</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h3><FaChartBar /> Top 10 Catégories</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: "#666" }} />
                <YAxis fontSize={12} tick={{ fill: "#666" }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h3><FaExclamationTriangle /> Statut Réclamations</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={recStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#f59e0b" /> {/* OUVERTE */}
                  <Cell fill="#3b82f6" /> {/* EN_COURS */}
                  <Cell fill="#10b981" /> {/* RESOLUE */}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
