import React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import logoSoftSys from "../../../assets/logo_SoftSys.png";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Tag,
  Truck,
  Settings,
  Shirt,
  Wind,
  Layers,
  PackageOpen,
  History,
  TrendingUp,
  Boxes,
  Factory,
  Waves,
  Layers3,
  ScanSearch,
  BarChart3,
  MessageSquareWarning,
  WashingMachine,
  LibraryBig, SlidersHorizontal, Cog, Wrench,Workflow 
} from "lucide-react";
import { PiUsersFourFill,PiWashingMachineBold  } from "react-icons/pi";

import { FaGlassWater ,FaPrescriptionBottle } from "react-icons/fa6";
import { LuCombine,LuWashingMachine  } from "react-icons/lu";
import { FaDropbox } from "react-icons/fa";


export const NAV_ITEMS = [
  {
    id: "rh",
    label: "Tableau de Bord",
    path: "/",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "params",
    label: "Parametrage",
    icon: <Settings className="w-5 h-5" />,
    children: [
      

       {
        label: "Bacs",
        path: "/bac",
        icon: <FaGlassWater className="w-4 h-4" />,
      },
       {
        label: "Lots",
        path: "/lot",
        icon: <FaPrescriptionBottle  className="w-4 h-4" />,
      },
         {
        label: "Agents",
        path: "/Agents",
        icon: <PiUsersFourFill  className="w-4 h-4" />,
      },
      ,
         {
        label: "Machines",
        path: "/machine",
        icon: <LuWashingMachine   className="w-4 h-4" />,
      },
      ,
       {
        label: "Programmes",
        path: "/programme",
        icon: <Workflow  className="w-4 h-4" />,
      },
        ,
       {
        label: "Stock",
        path: "/arsenal",
        icon: <FaDropbox  className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "suivi",
    label: "Suivi",
    icon: <ScanSearch className="w-5 h-5" />,
    children: [
      {
        label: "Tracking",
        path: "/tracking",
        icon: <ScanSearch className="w-4 h-4" />,
      },
      {
        label: "Inventaire",
        path: "/Linges",
        icon: <Package className="w-4 h-4" />,
      },
      
       {
        label: "Matériel",
        path: "/immo",
        icon: <LuCombine className="w-4 h-4" />,
      },
      {
        label: "Cycles Lavages",
        path: "/cycleLavage",
        icon: <PiWashingMachineBold  className="w-4 h-4" />,
      },
      
     
    ],
  },
  {
    id: "presences",
    label: "Zone Sale",
    icon: <Factory className="w-5 h-5" />,
    children: [
      {
        label: "Collage",
        path: "/collecteList",
        icon: <Tag className="w-4 h-4" />,
      },
     
      {
        label: "Réception",
        path: "/Receptions",
        icon: <PackageOpen className="w-4 h-4" />,
      },
      {
        label: "Tri",
        path: "/tri",
        icon: <LibraryBig className="w-4 h-4" />,
      },
      {
        label: "Lavage",
        path: "/Lavages",
        icon: <Waves className="w-4 h-4" />,
      },
      // ,
      // {
      //   label: "Laveurs",
      //   path: "/machines",
      //   icon: <WashingMachine className="w-4 h-4" />,
      // },
    ],
  },

  {
    id: "paie",
    label: "Zone Propre",
    icon: <Truck className="w-5 h-5" />,
    children: [
      {
        label: "Séchage",
        path: "/Sechages",
        icon: <Wind className="w-4 h-4" />,
      },
      {
        label: "Pliage",
        path: "/Pliages",
        icon: <Layers3 className="w-4 h-4" />,
      },
      {
        label: "Stockage",
        path: "/stockage",
        icon: <Warehouse className="w-4 h-4" />,
      },
      {
        label: "Livraisons",
        path: "/distribution",
        icon: <Truck className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "conges",
    label: "Reporting",
    icon: <BarChart3 className="w-5 h-5" />,
    children: [
      {
        label: "Historique",
        path: "/Historiques",
        icon: <History className="w-4 h-4" />,
      },
      {
        label: "Statistiques",
        path: "/Statistiques",
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        label: "Réclamations",
        path: "/Reclamations",
        icon: <MessageSquareWarning className="w-4 h-4" />,
      },  {
        label: "Process",
        path: "/process",
        icon: <MessageSquareWarning className="w-4 h-4" />,
      },
      ,  {
        label: "Historique collectes",
        path: "/collecte",
        icon: <MessageSquareWarning className="w-4 h-4" />,
      },
    ],
  },

];

export function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [activePopup, setActivePopup] = useState(null);

  const location = useLocation();
  const currentPath = location.pathname;

  const activeNavItem = NAV_ITEMS.find(
    (item) =>
      item.path === currentPath ||
      item.children?.some((child) => child.path === currentPath)
  );

  useEffect(() => {
    if (activeNavItem && sidebarOpen && activeNavItem.children) {
      setOpenSubmenu(activeNavItem.id);
    }
  }, [activeNavItem, sidebarOpen]);

  return (
    <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>
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
              <img src={logoSoftSys} className="sidebar__logo" alt="SoftSys" />
            </Link>
            <button className="sidebar__close-btn" onClick={() => setSidebarOpen(false)}>
              <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </React.Fragment>
        ) : (
          <button className="sidebar__menu-btn" onClick={() => setSidebarOpen(true)}>
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

      {sidebarOpen && (
        <div className="sidebar__search">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
            />
          </svg>
          <input placeholder="Rechercher..." readOnly />
        </div>
      )}

      <nav className="sidebar__nav">
        {sidebarOpen && <span className="sidebar__section-label">Menu principal</span>}
        {NAV_ITEMS.map((item) => (
          <div key={item.id} className="nav-item-wrap">
            {item.children ? (
              <button
                className={`nav-item nav-item--${item.id} ${
                  activeNavItem?.id === item.id ? "nav-item--active" : ""
                } ${!sidebarOpen ? "nav-item--icon-only" : ""}`}
                onClick={() => {
                  if (!sidebarOpen) {
                    setActivePopup((p) => (p === item.id ? null : item.id));
                  } else {
                    setOpenSubmenu((p) => (p === item.id ? null : item.id));
                  }
                }}
              >
                <span className="nav-item__icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-item__label">{item.label}</span>}
                {sidebarOpen && (
                  <svg
                    className={`nav-item__chevron--${item.id} ${
                      openSubmenu === item.id ? "nav-item__chevron--open" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </button>
            ) : (
              <Link
                to={item.path || "/"}
                className={`nav-item nav-item--${item.id} ${
                  currentPath === item.path ? "nav-item--active" : ""
                } ${!sidebarOpen ? "nav-item--icon-only" : ""}`}
                onClick={() => {
                  setActivePopup(null);
                  setOpenSubmenu(null);
                }}
              >
                <span className="nav-item__icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-item__label">{item.label}</span>}
              </Link>
            )}

            {!sidebarOpen && activePopup === item.id && (
              <div className="nav-popup">
                <span className="nav-popup__title">{item.label}</span>
                {item.children ? (
                  <div
                    className={`nav-popup__grid ${
                      item.children.length > 3 ? "nav-popup__grid--many" : "nav-popup__grid--few"
                    }`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.path}
                        className="nav-popup__card"
                        onClick={() => setActivePopup(null)}
                      >
                        <div className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}>
                          {child.icon}
                        </div>
                        <span className="nav-popup__card-label">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="nav-popup__simple">
                    <Link
                      to={item.path || "/"}
                      className={`nav-popup__simple-link nav-popup__simple-link--${item.id}`}
                      onClick={() => setActivePopup(null)}
                    >
                      <div className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {sidebarOpen && item.children && (
              <div
                className={`submenu ${openSubmenu === item.id ? "submenu--open" : ""}`}
                style={{
                  maxHeight: openSubmenu === item.id ? `${item.children.length * 42}px` : "0",
                }}
              >
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    to={child.path}
                    className={`submenu__link--${item.id} ${
                      currentPath === child.path ? "submenu__link--active" : ""
                    }`}
                  >
                    <span className={`submenu__link-icon submenu__link-icon--${item.id}`}>
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

      <div className="sidebar__footer">
        <button className={`nav-item nav-item--logout ${!sidebarOpen ? "nav-item--icon-only" : ""}`}>
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
          {sidebarOpen && <span className="nav-item__label">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}