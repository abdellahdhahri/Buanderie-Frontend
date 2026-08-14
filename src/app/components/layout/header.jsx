import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import logoSoftSys from "../../../assets/logo_SoftSys.png";
import { Sun, Moon, Bell, MessageSquare, ChevronDown, User, LogOut, Settings, Award, X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";
import { useNotifications } from "../../contextes/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

const BREADCRUMB_ITEMS = [
  { path: "/", parent: "", label: "Accueil" },
  { path: "/Receptions", parent: "Zone Sale", label: "Reception" },
  { path: "/Lavages", parent: "Zone Sale", label: "Lavage" },
  { path: "/Collages", parent: "Zone Sale", label: "Collage" },
  { path: "/Sechages", parent: "Zone Propre", label: "Séchage" },
  { path: "/Pliages", parent: "Zone Propre", label: "Pliage" },
  { path: "/stockage", parent: "Zone Propre", label: "Stockage" },
  { path: "/Linges", parent: "Operations ", label: "Linges" },
  { path: "/tracking", parent: "Operations", label: "Tracking" },
  { path: "/Historiques", parent: "Reporting", label: "Historiques" },
  { path: "/Statistiques", parent: "Reporting", label: "Statistiques" },
  { path: "/Reclamations", parent: "Reporting", label: "Reclamation" },
  { path: "/Livraisons", parent: "Zone Propre", label: "Livraison" },
];

// ─── Styles des notifications ──────────────────────────────────────────────
const NOTIFICATION_STYLES = {
  STOCK_UNIFORME: {
    icon: CheckCircle,
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#6ee7b7"
  },
  ALERTE_STOCK: {
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fcd34d"
  },
  LIVRAISON: {
    icon: Info,
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#93c5fd"
  },
  COLLECTE: {
    icon: Info,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#c4b5fd"
  },
  default: {
    icon: Bell,
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1"
  }
};

export function Header({ sidebarOpen, setSidebarOpen }) {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const { notifications } = useNotifications();
  const location = useLocation();
  const currentPath = location.pathname;

  // ─── État pour la notification popup ──────────────────────────────────────
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const currentItem = BREADCRUMB_ITEMS.find((item) => item.path === currentPath) || {
    parent: "",
    label: "Page",
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // ─── Surveiller les nouvelles notifications ───────────────────────────────
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Prendre la dernière notification (la plus récente)
      const lastNotif = notifications[notifications.length - 1];
      
      // Vérifier si c'est une nouvelle notification (non lue)
      if (!lastNotif.read) {
        setCurrentNotification(lastNotif);
        setShowPopup(true);
        
        // Fermer automatiquement après 5 secondes
        const timer = setTimeout(() => {
          setShowPopup(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // ─── Fermer la popup ──────────────────────────────────────────────────────
  const handleClosePopup = () => {
    setShowPopup(false);
    // Marquer comme lu si la fonction existe
    if (currentNotification && currentNotification.markAsRead) {
      currentNotification.markAsRead();
    }
  };

  // ─── Marquer comme lu sans fermer ────────────────────────────────────────
  const handleMarkAsRead = () => {
    if (currentNotification && currentNotification.markAsRead) {
      currentNotification.markAsRead();
    }
  };

  // ─── Formater le temps ────────────────────────────────────────────────────
  const formatTime = (timestamp) => {
    if (!timestamp) return "À l'instant";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <>
      <header className={`navbar ${sidebarOpen ? "navbar--shifted" : ""}`}>
        <div className="navbar__left">
          <button className="navbar__mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {!sidebarOpen && (
            <Link to="/" className="navbar__logo-link">
              <img src={logoSoftSys} alt="SoftSys" style={{ height: "48px", objectFit: "contain" }} />
            </Link>
          )}

          <div className="navbar__breadcrumb">
            <Link to="/" className="navbar__breadcrumb-root">
              Accueil
            </Link>

            {currentPath !== "/" && (
              <>
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
                {currentItem.parent && (
                  <>
                    <span className="navbar__breadcrumb-parent">{currentItem.parent}</span>
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </>
                )}
                <span className="navbar__breadcrumb-current">{currentItem.label}</span>
              </>
            )}
          </div>
        </div>

        <div className="navbar__right">
          <button className="navbar__icon-btn">
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>

          <button className="navbar__icon-btn" onClick={toggleTheme}>
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUserDropOpen(false);
              }}
              className="navbar__icon-btn navbar__icon-btn--notif"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="navbar__notif-dot">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="user-dropdown" style={{ top: "calc(100% + 8px)", right: 0, width: "320px", padding: "8px 0" }}>
                <div className="user-dropdown__header" style={{ padding: "12px 16px" }}>
                  <p className="user-dropdown__name" style={{ fontSize: "14px" }}>
                    Notifications
                  </p>
                </div>
                <div className="user-dropdown__menu" style={{ padding: "8px" }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 mb-2 rounded-lg bg-slate-50 hover:bg-slate-100">
                      <Badge variant={notif.type === "STOCK_UNIFORME" ? "success" : "info"}>
                        {notif.type}
                      </Badge>
                      <div>
                        <p className="text-xs font-semibold">{notif.message}</p>
                        <p className="text-[10px] text-gray-400">{notif.time}</p>
                        <p className="text-[10px] text-gray-400">{notif.codeLinge}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="navbar__divider" />

          <div className="relative navbar__user">
            <button
              className="user-btn"
              onClick={() => {
                setUserDropOpen(!userDropOpen);
                setShowNotifications(false);
              }}
            >
              <div className="w-[30px] h-[30px] rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                DF
              </div>
              <div className="user-btn__info">
                <span className="user-btn__name">Mr. Fouleni</span>
                <span className="user-btn__role">Administrateur</span>
              </div>
              <ChevronDown className={`user-btn__chevron ${userDropOpen ? "user-btn__chevron--open" : ""}`} />
            </button>

            {userDropOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown__header">
                  <p className="user-dropdown__name">Mr. Foulen Fouleni</p>
                  <p className="user-dropdown__email">foulen.fouleni@softsys.com</p>
                </div>
                <div className="user-dropdown__menu">
                  <Link to="/" className="user-dropdown__link" onClick={() => setUserDropOpen(false)}>
                    Tableau de bord
                  </Link>
                  <Link to="/parametres" className="user-dropdown__link" onClick={() => setUserDropOpen(false)}>
                    Paramètres
                  </Link>
                  <div className="user-dropdown__separator" />
                  <a href="#" className="user-dropdown__link user-dropdown__link--danger">
                    Déconnexion
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── POPUP DE NOTIFICATION ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showPopup && currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              width: "420px",
              maxWidth: "90vw",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.05)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              overflow: "hidden"
            }}
          >
            {/* Barre de progression */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              style={{
                height: "3px",
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                position: "absolute",
                top: 0,
                left: 0
              }}
            />

            {/* Contenu */}
            <div style={{ padding: "16px 20px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  {(() => {
                    const style = NOTIFICATION_STYLES[currentNotification.type] || NOTIFICATION_STYLES.default;
                    const Icon = style.icon;
                    return (
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: style.bg,
                        flexShrink: 0
                      }}>
                        <Icon style={{ color: style.color, width: "20px", height: "20px" }} />
                      </div>
                    );
                  })()}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        {currentNotification.type || "Notification"}
                      </span>
                      <Badge variant="destructive" style={{ fontSize: "8px", padding: "1px 8px" }}>
                        Nouveau
                      </Badge>
                    </div>
                    <p style={{ fontSize: "13px", color: "#334155", marginTop: "2px", fontWeight: 500 }}>
                      {currentNotification.message || currentNotification.codeLinge}
                    </p>
                    {currentNotification.codeLinge && (
                      <p style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        marginTop: "2px"
                      }}>
                        📦 Code: {currentNotification.codeLinge}
                      </p>
                    )}
                    <p style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginTop: "4px"
                    }}>
                      {formatTime(currentNotification.time || currentNotification.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Bouton fermer */}
                <button
                  onClick={handleClosePopup}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    transition: "all 0.2s",
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Actions */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #f1f5f9"
              }}>
                <button
                  onClick={handleClosePopup}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleMarkAsRead();
                    handleClosePopup();
                  }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#3b82f6"; }}
                >
                  Marquer comme lu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .navbar__notif-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
      `}</style>
    </>
  );
}