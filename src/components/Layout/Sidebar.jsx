import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEstablishment } from "../../hooks/useEstablishment";
import { DEFAULT_LOGO } from "../../services/establishmentService";
import { useAuth } from "../../constants/AuthContext";
import { IconLogout } from "./sidebarIcons";
import { NAV_ITEMS, filterNavByPrivileges, filtrerParEtapes, sansCircuitInfecte } from "../../constants/navigation";
import { useEtapes } from "../../hooks/useEtapes";

export function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [recherche, setRecherche] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname: currentPath } = useLocation();
  const { privileges = [], logout } = useAuth();
  const establishment = useEstablishment();
  const { estActive } = useEtapes();

  const label = (item) => t(`navigation.${item.id}`, item.label);
  const childLabel = (child) => t(`navigation.${child.label}`, child.label);
  const samePath = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

  const navItems = filterNavByPrivileges(
    filtrerParEtapes(establishment.circuitInfecte ? NAV_ITEMS : sansCircuitInfecte(NAV_ITEMS), estActive),
    privileges
  );

  const terme = recherche.trim().toLowerCase();
  const visibleNavItems = !terme ? navItems : navItems
    .map((item) => {
      if (label(item).toLowerCase().includes(terme)) return item;
      const children = item.children?.filter((c) => childLabel(c).toLowerCase().includes(terme));
      return children?.length ? { ...item, children } : null;
    })
    .filter(Boolean);

  const activeNavItem = navItems.find(
    (item) => samePath(item.path, currentPath) || item.children?.some((child) => samePath(child.path, currentPath))
  );

  useEffect(() => {
    if (activeNavItem?.children && sidebarOpen) setOpenSubmenu(activeNavItem.id);
  }, [activeNavItem?.id, sidebarOpen]);

  useEffect(() => {
    if (terme) setOpenSubmenu(visibleNavItems.find((i) => i.children)?.id ?? null);
  }, [terme]);

  useEffect(() => {
    const ouvert = activePopup ?? openSubmenu;
    if (!ouvert) return;
    const fermer = (e) => {
      if (e.target.closest?.(`[data-nav="${ouvert}"]`)) return;
      setActivePopup(null);
      setOpenSubmenu(null);
    };
    const echap = (e) => { if (e.key === "Escape") fermer(e); };
    document.addEventListener("pointerdown", fermer);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", fermer);
      document.removeEventListener("keydown", echap);
    };
  }, [activePopup, openSubmenu]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const ajusterPopup = (el) => {
    if (!el) return;
    el.style.top = "0px";
    const marge = 8;
    const hauteurMax = window.innerHeight - marge * 2;
    el.style.maxHeight = `${hauteurMax}px`;
    el.style.overflowY = "auto";
    const rect = el.getBoundingClientRect();
    let decalage = 0;
    if (rect.bottom > window.innerHeight - marge) decalage = window.innerHeight - marge - rect.bottom;
    if (rect.top + decalage < marge) decalage = marge - rect.top;
    el.style.top = `${decalage}px`;
  };

  const fermerSurMobile = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const logo = (
    <img
      src={establishment.logo}
      className="sidebar__logo"
      alt={establishment.nomApplication}
      onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_LOGO)) e.currentTarget.src = DEFAULT_LOGO; }}
    />
  );

  return (
    <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>
      <div className="sidebar__header">
        {sidebarOpen ? (
          <>
            <Link to="/" onClick={() => { setActivePopup(null); setOpenSubmenu(null); }} className="sidebar__logo-link">
              {logo}
            </Link>
            <button className="sidebar__close-btn" onClick={() => setSidebarOpen(false)}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button className="sidebar__menu-btn" onClick={() => setSidebarOpen(true)}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {sidebarOpen && (
        <div className="sidebar__search">
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
          </svg>
          <input
            placeholder={t("common.search")}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setRecherche(""); }}
          />
          {recherche && (
            <button type="button" className="sidebar__search-clear" onClick={() => setRecherche("")} aria-label="Effacer la recherche">×</button>
          )}
        </div>
      )}

      <nav className="sidebar__nav">
        {sidebarOpen && <span className="sidebar__section-label">{t("navigation.main_menu", "Menu principal")}</span>}
        {sidebarOpen && terme && visibleNavItems.length === 0 && (
          <span className="sidebar__search-empty">{t("navigation.no_match", "Aucun menu ne correspond")}</span>
        )}
        {visibleNavItems.map((item, index) => {
          const classes = `nav-item nav-item--${item.id} ${activeNavItem?.id === item.id ? "nav-item--active" : ""} ${!sidebarOpen ? "nav-item--icon-only" : ""}`;
          const contenu = (
            <>
              <span className="nav-item__icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-item__label">{label(item)}</span>}
              {sidebarOpen && item.badge && <span className="nav-item__badge">{item.badge}</span>}
              {sidebarOpen && item.children && (
                <svg className={`nav-item__chevron--${item.id} ${openSubmenu === item.id ? "nav-item__chevron--open" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              )}
              {item.badge && !sidebarOpen && <span className="nav-item__badge-dot" />}
            </>
          );

          return (
            <React.Fragment key={item.id}>
            {item.separateur && index > 0 && <div className={`sidebar__divider ${!sidebarOpen ? "sidebar__divider--compact" : ""}`} role="separator" />}
            <div className="nav-item-wrap" data-nav={item.id}>
              {sidebarOpen && !item.children ? (
                <Link to={item.path || "/"} className={classes} onClick={() => { setOpenSubmenu(null); fermerSurMobile(); }}>
                  {contenu}
                </Link>
              ) : (
                <button
                  className={classes}
                  onClick={() => {
                    if (!sidebarOpen) setActivePopup((p) => (p === item.id ? null : item.id));
                    else setOpenSubmenu((p) => (p === item.id ? null : item.id));
                  }}
                >
                  {contenu}
                </button>
              )}

              {!sidebarOpen && activePopup === item.id && (
                <div className="nav-popup" ref={ajusterPopup}>
                  <span className="nav-popup__title">{label(item)}</span>
                  {item.children ? (
                    <div className={`nav-popup__grid ${item.children.length > 3 ? "nav-popup__grid--many" : "nav-popup__grid--few"}`}>
                      {item.children.map((child) => (
                        <Link key={child.label} to={child.path || "#"} className={`nav-popup__card ${samePath(currentPath, child.path) ? "nav-popup__card--active" : ""}`} onClick={() => setActivePopup(null)}>
                          <div className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}>{child.icon}</div>
                          <span className="nav-popup__card-label">{childLabel(child)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="nav-popup__simple">
                      <Link to={item.path || "/"} className={`nav-popup__simple-link nav-popup__simple-link--${item.id}`} onClick={() => setActivePopup(null)}>
                        <div className={`nav-popup__card-icon nav-popup__card-icon--${item.id}`}>{item.icon}</div>
                        <span>{label(item)}</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {sidebarOpen && item.children && (
                <div
                  className={`submenu ${openSubmenu === item.id ? "submenu--open" : ""}`}
                  style={{ maxHeight: openSubmenu === item.id ? `${item.children.length * 40}px` : "0" }}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.path || "#"}
                      tabIndex={openSubmenu === item.id ? undefined : -1}
                      className={`submenu__link--${item.id} ${samePath(currentPath, child.path) ? "submenu__link--active" : ""}`}
                      onClick={fermerSurMobile}
                    >
                      <span className={`submenu__link-icon submenu__link-icon--${item.id}`}>{child.icon}</span>
                      {childLabel(child)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button className={`nav-item nav-item--logout ${!sidebarOpen ? "nav-item--icon-only" : ""}`} onClick={handleLogout}>
          <span className="nav-item__icon"><IconLogout /></span>
          {sidebarOpen && <span className="nav-item__label">{t("navigation.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
