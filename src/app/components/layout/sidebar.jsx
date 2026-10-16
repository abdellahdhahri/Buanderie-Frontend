// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import logoSoftSys from "../../../assets/logo_SoftSys.png";
import { useAuth } from "../../contextes/Authentication/AuthContext";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconDashboard, IconSettings, IconBin, IconSteps, IconBundle, IconInfectedBag, IconMachines, IconProgram, IconShelves, IconMonitoring, IconTracking, IconWashCycle, IconBed, IconMachineStatus, IconInventory, IconGarment, IconDirtyZone, IconCollect, IconReception, IconSort, IconWashing, IconCleanZone, IconDrying, IconFolded, IconDelivery, IconDistribution, IconReporting, IconHistory, IconStats, IconComplaint, IconCollectHistory, IconLogout,
} from "./sidebarIcons";

export const NAV_ITEMS = [
  {
    id: "rh",
    label: "Tableau de Bord",
    path: "/",
    privilege: "LIG09",
    icon: <IconDashboard />,
  },

  {
    id: "params",
    label: "Parametrage",
    privilege: "LIG12",
    icon: <IconSettings />,
    children: [
      {
        label: "Bacs",
        path: "/bac",
        privilege: "LIG1201",
        icon: <IconBin />,
      },
      {
        label: "Étapes",
        path: "/etape",
        privilege: "LIG1201",
        icon: <IconSteps />,
      },
      {
        label: "Lots",
        path: "/lot",
        privilege: "LIG1202",
        icon: <IconBundle />,
      },
      {
  label: "Sacs Infectés",
  path: "/sacs",
  privilege: "LIG1401",   
  icon: <IconInfectedBag />,
},
      {
        label: "Machines",
        path: "/machine",
        privilege: "LIG1203",
        icon: <IconMachines />,
      },
      {
        label: "Programmes",
        path: "/programme",
        privilege: "LIG1204",
        icon: <IconProgram />,
      },
      {
        label: "Stock",
        path: "/arsenal",
        privilege: "LIG1205",
        icon: <IconShelves />,
      }
      // ,
      // {
      //   label: "Agents",
      //   path: "/Agents",
      //   privilege: "LIG1206",
      //   icon: (
      //     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      //       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      //       <circle cx="12" cy="7" r="4" />
      //     </svg>
      //   ),
      // },
    ],
  },

  {
    id: "suivi",
    label: "Suivi",
    privilege: "LIG13",
    icon: <IconMonitoring />,
    children: [
      {
        label: "Tracking",
        path: "/tracking",
        privilege: "LIG1301",
        icon: <IconTracking />,
      },
      {
        label: "Cycles Lavages",
        path: "/cycleLavage",
        privilege: "LIG1302",
        icon: <IconWashCycle />,
      },
      {
        label: "Chambres",
        path: "/chambre",
        privilege: "LIG1303",
        icon: <IconBed />,
      },
      // {
      //   label: "Matériel",
      //   path: "/immo",
      //   privilege: "LIG1304",
      //   icon: (
      //     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      //       <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
      //       <line x1="8" y1="2" x2="8" y2="22" />
      //       <line x1="16" y1="2" x2="16" y2="22" />
      //       <line x1="2" y1="8" x2="22" y2="8" />
      //       <line x1="2" y1="16" x2="22" y2="16" />
      //     </svg>
      //   ),
      // },
  {
  label: "etat machines",
  path: "/machines",
  privilege: "LIG1304",
  icon: <IconMachineStatus />,
},
      {
        label: "Suivi du stock",
        path: "/suivi-stock",
        privilege: "LIG1305",
        icon: <IconMonitoring />,
      },
      {
        label: "Inventaire",
        path: "/inventaire",
        privilege: "LIG1305",
        icon: <IconInventory />,
      },
      {
        label: "Linges",
        path: "/Linges",
        privilege: "LIG02",
        icon: <IconGarment />,
      },
    ],
  },

  {
    id: "presences",
    label: "Zone Sale",
    privilege: "LIG15",
    icon: <IconDirtyZone />,
    children: [
      {
        label: "Collecte",
        path: "/collecteList",
        privilege: "LIG1501",
        icon: <IconCollect />,
      },
      {
        label: "Réception",
        path: "/Receptions",
        privilege: "LIG1502",
        icon: <IconReception />,
      },
      {
        label: "Tri",
        path: "/tri",
        privilege: "LIG1503",
        icon: <IconSort />,
      },
      {
        label: "Lavage",
        path: "/lavages",
        privilege: "LIG1504",
        icon: <IconWashing />,
      },
    ],
  },

  {
    id: "paie",
    label: "Zone Propre",
    privilege: "LIG16",
    icon: <IconCleanZone />,
    children: [
      {
        label: "Séchage",
        path: "/Sechages",
        privilege: "LIG1601",
        icon: <IconDrying />,
      },
      {
        label: "Pliage",
        path: "/Pliages",
        privilege: "LIG1602",
        icon: <IconFolded />,
      },
      {
        label: "Livraison",
        path: "/remise",
        privilege: "LIG1604",
        icon: <IconDelivery />,
      },
      {
        label: "Stockage Arsenal",
        path: "/stockage-arsenal",
        privilege: "LIG1603",
        icon: <IconShelves />,
      },
      {
        label: "Distribution",
        path: "/distribution",
        privilege: "LIG1605",
        icon: <IconDistribution />,
      },
    ],
  },

  {
    id: "conges",
    label: "Reporting",
    privilege: "LIG14",
    icon: <IconReporting />,
    children: [
      {
        label: "Historique",
        path: "/Historiques",
        privilege: "LIG1401",
        icon: <IconHistory />,
      },
      {
        label: "Statistiques",
        path: "/Statistiques",
        privilege: "LIG1402",
        icon: <IconStats />,
      },
      {
        label: "Réclamations",
        path: "/Reclamations",
        privilege: "LIG1403",
        icon: <IconComplaint />,
      },
      {
        label: "Historique collectes",
        path: "/collecte",
        privilege: "LIG1404",
        icon: <IconCollectHistory />,
      },
    ],
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }) {

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

 useEffect(() => {

    const bundle = i18n.getResourceBundle(i18n.language, 'translation');

  }, [i18n.language, t, i18n]);
  

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

  const activeNavItem = filteredNavItems.find(
    (item) =>
      item.path === currentPath ||
      item.children?.some(
        (child) => child.path === currentPath
      )
  );

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
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
  }, []);

  const toggleSubmenu = (itemId) => {
    setOpenSubmenu((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <aside
      className={`sidebar ${
        sidebarOpen
          ? "sidebar--open"
          : "sidebar--closed"
      }`}
    >

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
            placeholder={t('common.search')}
            readOnly
          />

        </div>

      )}

      <nav className="sidebar__nav">

        {sidebarOpen && (
          <span className="sidebar__section-label">
            {t('navigation.dashboard')}
          </span>
        )}

        {filteredNavItems.map((item) => (

          <div
            key={item.id}
            className="nav-item-wrap"
          >

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
                } ${
                  sidebarOpen && openSubmenu === item.id
                    ? "nav-item--expanded"
                    : ""
                }`}
                aria-expanded={sidebarOpen ? openSubmenu === item.id : undefined}
                onClick={() => {

                  if (!sidebarOpen) {

                    setActivePopup(
                      (p) =>
                        p === item.id
                          ? null
                          : item.id
                    );

                  } else {

                    toggleSubmenu(item.id);

                  }

                }}
              >

                <span className="nav-item__icon">
                  {item.icon}
                </span>

                {sidebarOpen && (
                  <span className="nav-item__label">
                    {t(`navigation.${item.id}`, item.label)}
                  </span>
                )}

                {sidebarOpen && (
                  <span className="nav-item__count">
                    {item.children.length}
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
                    {t(`navigation.${item.id}`, item.label)}
                  </span>
                )}

              </Link>

            )}

            {!sidebarOpen &&
              activePopup === item.id && (

                <div className="nav-popup">

                  <span className="nav-popup__title">
                    {t(`navigation.${item.id}`, item.label)}
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
                            {t(`navigation.${child.label}`, child.label)}
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
                          {t(`navigation.${item.id}`, item.label)}
                        </span>

                      </Link>

                    </div>

                  )}

                </div>

              )}

            {sidebarOpen &&
              item.children && (

                <div
                  className={`submenu submenu--${item.id} ${
                    openSubmenu === item.id
                      ? "submenu--open"
                      : ""
                  }`}
                >
                <div className="submenu__inner">

                  {item.children.map((child, index) => (

                    <Link
                      key={child.label}
                      to={child.path}
                      style={{ "--i": index }}
                      tabIndex={openSubmenu === item.id ? undefined : -1}
                      className={`submenu__link ${
                        currentPath === child.path
                          ? "submenu__link--active"
                          : ""
                      }`}
                      onClick={() => {
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

                      <span className="submenu__link-label">
                        {t(`navigation.${child.label}`, child.label)}
                      </span>

                    </Link>

                  ))}

                </div>
                </div>

              )}

          </div>

        ))}

      </nav>

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

            <IconLogout />

          </span>

          {sidebarOpen && (
            <span className="nav-item__label">
              {t('navigation.logout')}
            </span>
          )}

        </button>

      </div>

    </aside>
  );
}