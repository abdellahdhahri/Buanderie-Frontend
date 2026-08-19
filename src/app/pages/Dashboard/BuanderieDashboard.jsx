import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { LingeContext } from "../../contextes/LingeContext";
import "./BuanderieDashboard.css";
import { FaBoxes, FaHandHolding, FaReceipt, FaSoap, FaWind, FaBoxOpen, FaWarehouse, FaTruck, FaSearch, FaHistory, FaRss, FaExclamationTriangle, FaChartPie } from "react-icons/fa";
import { VscFilterFilled } from "react-icons/vsc";
import { NAV_ITEMS } from '../../components/layout/sidebar';
import SpotlightCard from '../../components/ui/SpotlightCard';
import React from "react";
 
const sections = [
  { name: "Linge", path: "/linge", icon: <FaBoxes />, color:"#0ea5e9" },
  { name: "Tracking", path: "/tracking", icon: <FaSearch />, color:"#8b5cf6" },
  { name: "Historique", path: "/historique-global", icon: <FaHistory />, color: "#f6da5c" },
  { name: "Collecte", path: "/colage", icon: <FaHandHolding />, color: "#38bdf8" },
  { name: "Réception", path: "/reception", icon: <FaReceipt />, color: "#0ea5e9" },
  { name: "Lavage", path: "/lavage", icon: <FaSoap />, color: "#0ea5e9" },
  { name: "Séchage", path: "/sechage", icon: <FaWind />, color: "#38bdf8" },
  { name: "Pliage", path: "/pliage", icon: <FaBoxOpen />, color:"#38bdf8" },
  { name: "Stockage", path: "/stockage", icon: <FaWarehouse />, color: "#38bdf8" },
  { name: "Livraison", path: "/livraison", icon: <FaTruck />, color: "#38bdf8" },
  { name: "Reclamations", path: "/reclamations", icon: <FaExclamationTriangle />, color: "#ef4444" },
  { name: "Statistiques", path: "/statistiques", icon: <FaChartPie/>, color: "#ef44b6" },

];

export default function DashboardBuanderie() {
  const navigate = useNavigate();
  const { linges, isRfidMode, setIsRfidMode } = useContext(LingeContext); 

  /*const totalLinge = linges.length;
  const enLavage = linges.filter((l: { etat: string; }) => l.etat === "EN_LAVAGE").length;
  const enSechage = linges.filter((l: { etat: string; }) => l.etat === "EN_SECHAGE_REPASSAGE").length;
  const enStock = linges.filter((l: { etat: string; }) => l.etat === "STOCKE").length;*/

  return (
        <div className="dashboard-wrapper">
            <div className="dashboard-overlay-content">
                <div className="dashboard-header">
                    <h1>Gestion de Buanderie</h1>
                    <p>Bienvenue dans votre espace de gestion de buanderie</p>
                </div>

                <div className="dashboard-grid">
                    {NAV_ITEMS.map((item) => (
                        <SpotlightCard
                            key={item.id}
                            spotlightColor="rgba(0, 229, 255, 0.2)"
                            className="dashboard-card"
                        >
                            <div className="card-inner">
                                {/* Front Content */}
                                <div className="card-front">
                                    <div className="icon-wrapper">
                                        {React.cloneElement(item.icon, { width: 40, height: 40 })}
                                    </div>
                                    <h3>{item.label}</h3>
                                    {/* <p className="card-description">
                                        Gérer les {item.label.toLowerCase()} de la buanderie
                                    </p> */}
                                </div>

                                <div className="card-back">
<div
  className={`sub-module-grid ${
    (item.children?.length ?? 0) > 4 ? 'compact' : ''
  }`}
>                                        {item.children?.map((child, idx) => (
                                            <Link key={idx} to={child.path || '#'} className="sub-module-item">
                                                <div className="sub-module-icon">
                                                    {React.cloneElement(child.icon, {
                                                        width: item.children?.length > 4 ? 14 : 18,
                                                        height: item.children?.length > 4 ? 14 : 18
                                                    })}
                                                </div>
                                                <span>{child.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SpotlightCard>
                    ))}
                </div>
            </div>
        </div>
    );
}