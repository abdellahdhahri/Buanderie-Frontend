import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";

import { useState, useEffect } from 'react';

import "./BuanderieDashboard.css";
import { FaBoxes, FaHandHolding, FaReceipt, FaSoap, FaWind, FaBoxOpen, FaWarehouse, FaTruck, FaSearch, FaHistory, FaRss, FaExclamationTriangle, FaChartPie } from "react-icons/fa";
import { VscFilterFilled } from "react-icons/vsc";
import { NAV_ITEMS } from '../../components/layout/sidebar';
import SpotlightCard from '../../components/ui/SpotlightCard';
import LaundryBackground from './LaundryBackground'; 
import React from "react";

const SECTION_KEYS = {
  1: "rh",           
  2: "params",       
  3: "suivi",        
  4: "presences",    
  5: "paie",         
  6: "conges",       
};

const CHILD_KEYS = {
  "Bacs": "Bacs",
  "Étapes": "Étapes",
  "Lots": "Lots",
  "Machines": "Machines",
  "Programmes": "Programmes",
  "Stock": "Stock",
  "Agents": "Agents",
  "Tracking": "Tracking",
  "Cycles Lavages": "Cycles Lavages",
  "Chambres": "Chambres",
  "Matériel": "Matériel",
  "etat machines": "etat machines",
  "Inventaire": "Inventaire",
  "Linges": "Linges",
  "Collecte": "Collecte",
  "Réception": "Réception",
  "Tri": "Tri",
  "Lavage": "Lavage",
  "Séchage": "Séchage",
  "Pliage": "Pliage",
  "Stockage": "Stockage",
  "Livraison": "Livraison",
  "Distribution": "Distribution",
  "Historique": "Historique",
  "Statistiques": "Statistiques",
  "Réclamations": "Réclamations",
  "Historique collectes": "Historique collectes",
};

function DashboardBuanderieInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { linges, isRfidMode } = useContext(LingeContext);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    useEffect(() => {
    const handleSidebarChange = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        setIsSidebarOpen(sidebar.classList.contains('sidebar--open'));
      }
    };
    const observer = new MutationObserver(handleSidebarChange);
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      // Vérifier l'état initial
      handleSidebarChange();
    }
    
    return () => observer.disconnect();
  }, []);

  // Statistiques optionnelles (décommenter si nécessaire)
  // const totalLinge = linges.length;
  // const enLavage = linges.filter((l: { etat: string; }) => l.etat === "EN_LAVAGE").length;
  // const enSechage = linges.filter((l: { etat: string; }) => l.etat === "EN_SECHAGE_REPASSAGE").length;
  // const enStock = linges.filter((l: { etat: string; }) => l.etat === "STOCKE").length;

  // ─── Fonction pour obtenir la traduction d'un élément ──────────────────
  const getLabel = (item) => {
    // Pour les éléments parents, utiliser l'ID pour la traduction
    if (SECTION_KEYS[item.id]) {
      return t(`navigation.${SECTION_KEYS[item.id]}`, item.label);
    }
    // Pour les enfants, utiliser le label comme clé
    return t(`navigation.${CHILD_KEYS[item.label] || item.label}`, item.label);
  };

  return (
    <div className={`dashboard-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* ─── Fond animé (position: fixed, derrière le contenu) ─────────────── */}
      <LaundryBackground />

      <div className="dashboard-overlay-content">
        {/* ─── En-tête ──────────────────────────────────────────────────────── */}
        <div className="dashboard-header">
          <h1>{t('dashboard_buanderie.title')}</h1>
          <p>{t('dashboard_buanderie.welcome')}</p>
        </div>

        {/* ─── Grille des cartes ───────────────────────────────────────────── */}
        <div className="dashboard-grid">
          {NAV_ITEMS.map((item) => {
            // Vérifier si l'élément doit être affiché (avec ses enfants)
            // Cette logique est déjà gérée par le sidebar, mais on l'utilise pour le dashboard
            const hasChildren = item.children && item.children.length > 0;
            const itemLabel = getLabel(item);

            return (
              <SpotlightCard
                key={item.id}
                spotlightColor="rgba(0, 229, 255, 0.2)"
                className="dashboard-card"
              >
                <div className="card-inner">
                  {/* Face avant */}
                  <div className="card-front">
                    <div className="icon-wrapper">
                      {item.icon &&
                        React.cloneElement(item.icon, {
                          width: 40,
                          height: 40,
                        })}
                    </div>
                    <h3>{itemLabel}</h3>
                    <p className="card-description">
                      {t(`dashboard_buanderie.descriptions.${SECTION_KEYS[item.id] || item.id}`)}
                    </p>
                  </div>

                  {/* Face arrière avec les sous-modules */}
                  {hasChildren && (
                    <div className="card-back">
                      <div
                        className={`sub-module-grid ${
                          (item.children?.length ?? 0) > 4 ? 'compact' : ''
                        }`}
                      >
                        {item.children?.map((child, idx) => {
                          const childLabel = t(`navigation.${CHILD_KEYS[child.label] || child.label}`, child.label);
                          return (
                            <Link key={idx} to={child.path || '#'} className="sub-module-item">
                              <div className="sub-module-icon">
                                {child.icon &&
                                  React.cloneElement(child.icon, {
                                    width: item.children?.length > 4 ? 14 : 18,
                                    height: item.children?.length > 4 ? 14 : 18,
                                  })}
                              </div>
                              <span>{childLabel}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {/* ─── Statistiques (optionnel) ────────────────────────────────────── */}
        {/* {linges && linges.length > 0 && (
          <div style={{ 
            marginTop: "32px", 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "16px",
            padding: "20px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {linges.length}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {t('dashboard_buanderie.stats.total_linens')}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {linges.filter(l => l.etat === "EN_LAVAGE").length || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {t('dashboard_buanderie.stats.in_wash')}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {linges.filter(l => l.etat === "EN_SECHAGE_REPASSAGE" || l.etat === "SECHE").length || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {t('dashboard_buanderie.stats.in_drying')}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {linges.filter(l => l.etat === "STOCKE").length || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {t('dashboard_buanderie.stats.in_stock')}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default function DashboardBuanderie() {
  return <DashboardBuanderieInner />;
}