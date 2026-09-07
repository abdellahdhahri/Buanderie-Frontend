import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import logoSoftSys from "../../../assets/logo_SoftSys.png";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import { useNavigate } from 'react-router-dom';

export const NAV_ITEMS = [
  {
    id: "rh",
    label: "Tableau de Bord",
    path: "/",
    privilege: "LIG09",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },

  {
    id: "params",
    label: "Parametrage",
    privilege: "LIG12",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 001.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    children: [
      {
        label: "Bacs",
        path: "/bac",
        privilege: "LIG1201",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
      {
        label: "Étapes",
        path: "/etape",
        privilege: "LIG1201",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <path d="M12 22V17" />
            <path d="M8 7l4 2 4-2" />
          </svg>
        ),
      },
      {
        label: "Lots",
        path: "/lot",
        privilege: "LIG1202",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: "Machines",
        path: "/machine",
        privilege: "LIG1203",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
      {
        label: "Programmes",
        path: "/programme",
        privilege: "LIG1204",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <polyline points="21 3 12 12 9 9" />
          </svg>
        ),
      },
      {
        label: "Stock",
        path: "/arsenal",
        privilege: "LIG1205",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        ),
      },
      {
        label: "Agents",
        path: "/Agents",
        privilege: "LIG1206",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },

  {
    id: "suivi",
    label: "Suivi",
    privilege: "LIG13",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v3l2 2" />
      </svg>
    ),
    children: [
      {
        label: "Tracking",
        path: "/tracking",
        privilege: "LIG1301",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        label: "Cycles Lavages",
        path: "/cycleLavage",
        privilege: "LIG1302",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
          </svg>
        ),
      },
      {
        label: "Chambres",
        path: "/chambre",
        privilege: "LIG1303",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: "Matériel",
        path: "/immo",
        privilege: "LIG1304",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
            <line x1="8" y1="2" x2="8" y2="22" />
            <line x1="16" y1="2" x2="16" y2="22" />
            <line x1="2" y1="8" x2="22" y2="8" />
            <line x1="2" y1="16" x2="22" y2="16" />
          </svg>
        ),
      },
  {
  label: "etat machines",
  path: "/machines",
  privilege: "LIG1304",
  icon: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {/* Corps de la machine */}
      <rect x="3" y="2" width="18" height="20" rx="2" />

      {/* Bandeau supérieur */}
      <line x1="3" y1="7" x2="21" y2="7" />

      {/* Boutons */}
      <circle cx="7" cy="4.5" r="0.8" fill="currentColor" />
      <circle cx="10" cy="4.5" r="0.8" fill="currentColor" />

      {/* Tambour */}
      <circle cx="12" cy="14" r="5.2" />

      {/* Intérieur du tambour */}
      <circle cx="12" cy="14" r="3.8" />

      {/* Petit détail */}
      <path d="M9.5 14c.7-1.2 1.5-1.8 2.5-1.8s1.8.6 2.5 1.8" />
    </svg>
  ),
},
      {
        label: "Inventaire",
        path: "/inventaire",
        privilege: "LIG1305",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
      {
        label: "Linges",
        path: "/Linges",
        privilege: "LIG02",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
    ],
  },

  {
    id: "presences",
    label: "Zone Sale",
    privilege: "LIG15",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
    children: [
      {
        label: "Collecte",
        path: "/collecteList",
        privilege: "LIG1501",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        label: "Réception",
        path: "/Receptions",
        privilege: "LIG1502",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
      },
      {
        label: "Tri",
        path: "/tri",
        privilege: "LIG1503",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
      {
        label: "Lavage",
        path: "/Lavages",
        privilege: "LIG1504",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
            <path d="M8 8l8 8" />
            <path d="M8 16l8-8" />
          </svg>
        ),
      },
    ],
  },

  {
    id: "paie",
    label: "Zone Propre",
    privilege: "LIG16",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
    ),
    children: [
      {
        label: "Séchage",
        path: "/Sechages",
        privilege: "LIG1601",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4 12H2" />
            <path d="M22 12h-2" />
            <path d="M19 5l-3 3" />
            <path d="M8 16l-3 3" />
            <path d="M16 16l3 3" />
            <path d="M5 5l3 3" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        label: "Pliage",
        path: "/Pliages",
        privilege: "LIG1602",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
      {
        label: "Stockage",
        path: "/stockage",
        privilege: "LIG1603",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
      {
        label: "Livraison",
        path: "/remise",
        privilege: "LIG1604",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.5 6 3 6 3s6-1.5 6-3v-5" />
            <path d="M12 20v-5" />
            <circle cx="12" cy="10" r="1.5" />
            <path d="M8 7l-2 3" />
            <path d="M16 7l2 3" />
          </svg>
        ),
      },
      {
        label: "Distribution",
        path: "/distribution",
        privilege: "LIG1605",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 3h5l2 9h13l4-7h-9" />
            <circle cx="6" cy="19" r="2" />
            <circle cx="18" cy="19" r="2" />
            <line x1="12" y1="12" x2="12" y2="19" />
          </svg>
        ),
      },
    ],
  },

  {
    id: "conges",
    label: "Reporting",
    privilege: "LIG14",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
      </svg>
    ),
    children: [
      {
        label: "Historique",
        path: "/Historiques",
        privilege: "LIG1401",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        label: "Statistiques",
        path: "/Statistiques",
        privilege: "LIG1402",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="9" y1="15" x2="15" y2="9" />
          </svg>
        ),
      },
      {
        label: "Réclamations",
        path: "/Reclamations",
        privilege: "LIG1403",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      },
      {
        label: "Historique collectes",
        path: "/collecte",
        privilege: "LIG1404",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ),
      },
    ],
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }) {

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const navigate = useNavigate();

  const location = useLocation();
  const currentPath = location.pathname;
  const handleLogout = () => {
    logout();
    navigate('/process');
  };
  const {
    privileges = [],
    logout
  } = useAuth();

  const hasFullAccess =
    privileges.includes("ADMIN") || privileges.includes("ALL");

  const hasPrivilege = (code) => {

    if (!code) {
      return true;
    }

    if (hasFullAccess) {
      return true;
    }

    return privileges.includes(code);
  };

  const filteredNavItems = NAV_ITEMS
    .map((item) => {

      if (item.children) {

        if (!hasPrivilege(item.privilege)) {
          return null;
        }

        const filteredChildren = item.children.filter(
          (child) => hasPrivilege(child.privilege)
        );

        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      if (!hasPrivilege(item.privilege)) {
        return null;
      }

      return item;

    })
    .filter(Boolean);

  // ============================================================
  // Menu actif
  // ============================================================

  const activeNavItem = filteredNavItems.find(
    (item) =>
      item.path === currentPath ||
      item.children?.some(
        (child) => child.path === currentPath
      )
  );

  // ============================================================
  // Ouvrir automatiquement le sous-menu actif (UNIQUEMENT au premier chargement)
  // ============================================================

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // ✅ Ne s'exécute qu'une seule fois au montage
    if (!initialized) {
      if (
        activeNavItem &&
        activeNavItem.children &&
        activeNavItem.children.length > 0 &&
        sidebarOpen
      ) {
        setOpenSubmenu(activeNavItem.id);
      }
      setInitialized(true);
    }
  }, []); // ✅ Dépendance vide = exécuté une seule fois

  // ============================================================
  // Gestion manuelle de l'ouverture/fermeture
  // ============================================================

  const toggleSubmenu = (itemId) => {
    setOpenSubmenu((prev) => (prev === itemId ? null : itemId));
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside
      className={`sidebar ${
        sidebarOpen
          ? "sidebar--open"
          : "sidebar--closed"
      }`}
    >

      {/* HEADER */}

      <div className="sidebar__header">

        {sidebarOpen ? (

          <React.Fragment>

            <Link
              to="/"
              onClick={() => {
                setActivePopup(null);
                setOpenSubmenu(null);
              }}
              className="sidebar__logo-link"
            >
              <img
                src={logoSoftSys}
                className="sidebar__logo"
                alt="SoftSys"
              />
            </Link>

            <button
              className="sidebar__close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

          </React.Fragment>

        ) : (

          <button
            className="sidebar__menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>

        )}

      </div>

      {/* SEARCH */}

      {sidebarOpen && (

        <div className="sidebar__search">

          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
            />
          </svg>

          <input
            placeholder="Rechercher..."
            readOnly
          />

        </div>

      )}

      {/* NAVIGATION */}

      <nav className="sidebar__nav">

        {sidebarOpen && (
          <span className="sidebar__section-label">
            Menu principal
          </span>
        )}

        {filteredNavItems.map((item) => (

          <div
            key={item.id}
            className="nav-item-wrap"
          >

            {/* ===============================
                MENU AVEC SOUS-MENUS
            =============================== */}

            {item.children ? (

              <button
                className={`nav-item nav-item--${item.id} ${
                  activeNavItem?.id === item.id
                    ? "nav-item--active"
                    : ""
                } ${
                  !sidebarOpen
                    ? "nav-item--icon-only"
                    : ""
                }`}
                onClick={() => {

                  if (!sidebarOpen) {

                    setActivePopup(
                      (p) =>
                        p === item.id
                          ? null
                          : item.id
                    );

                  } else {

                    // ✅ Toggle manuel du sous-menu
                    toggleSubmenu(item.id);

                  }

                }}
              >

                <span className="nav-item__icon">
                  {item.icon}
                </span>

                {sidebarOpen && (
                  <span className="nav-item__label">
                    {item.label}
                  </span>
                )}

                {sidebarOpen && (

                  <svg
                    className={`nav-item__chevron--${item.id} ${
                      openSubmenu === item.id
                        ? "nav-item__chevron--open"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>

                )}

              </button>

            ) : (

              /* ===============================
                 MENU SIMPLE
              =============================== */

              <Link
                to={item.path || "/"}
                className={`nav-item nav-item--${item.id} ${
                  currentPath === item.path
                    ? "nav-item--active"
                    : ""
                } ${
                  !sidebarOpen
                    ? "nav-item--icon-only"
                    : ""
                }`}
                onClick={() => {
                  setActivePopup(null);
                  setOpenSubmenu(null);
                }}
              >

                <span className="nav-item__icon">
                  {item.icon}
                </span>

                {sidebarOpen && (
                  <span className="nav-item__label">
                    {item.label}
                  </span>
                )}

              </Link>

            )}

            {/* ===============================
                POPUP SIDEBAR FERMÉ
            =============================== */}

            {!sidebarOpen &&
              activePopup === item.id && (

                <div className="nav-popup">

                  <span className="nav-popup__title">
                    {item.label}
                  </span>

                  {item.children ? (

                    <div
                      className={`nav-popup__grid ${
                        item.children.length > 3
                          ? "nav-popup__grid--many"
                          : "nav-popup__grid--few"
                      }`}
                    >

                      {item.children.map((child) => (

                        <Link
                          key={child.label}
                          to={child.path}
                          className="nav-popup__card"
                          onClick={() =>
                            setActivePopup(null)
                          }
                        >

                          <div
                            className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}
                          >
                            {child.icon}
                          </div>

                          <span className="nav-popup__card-label">
                            {child.label}
                          </span>

                        </Link>

                      ))}

                    </div>

                  ) : (

                    <div className="nav-popup__simple">

                      <Link
                        to={item.path || "/"}
                        className={`nav-popup__simple-link nav-popup__simple-link--${item.id}`}
                        onClick={() =>
                          setActivePopup(null)
                        }
                      >

                        <div
                          className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}
                        >
                          {item.icon}
                        </div>

                        <span>
                          {item.label}
                        </span>

                      </Link>

                    </div>

                  )}

                </div>

              )}

            {/* ===============================
                SOUS-MENU SIDEBAR OUVERT
            =============================== */}

            {sidebarOpen &&
              item.children && (

                <div
                  className={`submenu ${
                    openSubmenu === item.id
                      ? "submenu--open"
                      : ""
                  }`}
                  style={{
                    maxHeight:
                      openSubmenu === item.id
                        ? `${item.children.length * 42}px`
                        : "0",
                  }}
                >

                  {item.children.map((child) => (

                    <Link
                      key={child.label}
                      to={child.path}
                      className={`submenu__link--${item.id} ${
                        currentPath === child.path
                          ? "submenu__link--active"
                          : ""
                      }`}
                      onClick={() => {
                        // ✅ Fermer le sous-menu après la navigation sur mobile
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >

                      <span
                        className={`submenu__link-icon submenu__link-icon--${item.id}`}
                      >
                        {child.icon}
                      </span>

                      {child.label}

                    </Link>

                  ))}

                </div>

              )}

          </div>

        ))}

      </nav>

      {/* FOOTER */}

      <div className="sidebar__footer">

        <button
          className={`nav-item nav-item--logout ${
            !sidebarOpen
              ? "nav-item--icon-only"
              : ""
          }`}
          onClick={handleLogout}
        >

          <span className="nav-item__icon">

            <svg
              className="nav-icon-svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"
              />
            </svg>

          </span>

          {sidebarOpen && (
            <span className="nav-item__label">
              Déconnexion
            </span>
          )}

        </button>

      </div>

    </aside>
  );
}