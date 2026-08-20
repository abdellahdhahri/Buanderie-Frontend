import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router";
import logoSoftSys from "../../../assets/logo_SoftSys.png";
import { 
  Sun, Moon, Bell, MessageSquare, ChevronDown, User, LogOut, 
  Settings, Award, X, CheckCircle, AlertCircle, Info, AlertTriangle,
  Eye, CheckCheck 
} from "lucide-react";
import { Badge } from "../ui/badge";
import { 
  getUnreadCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotifications 
} from "../../services/NotificationService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  getAgent, 
  authenticateAgent, 
  logoutAgent, 
  isAgentConnected,
  getAgentRoute,
  getAgentPosteName
} from '../../services/agentService';

// ─── BREADCRUMB ──────────────────────────────────────────────────────────
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

// ─── STYLES DES NOTIFICATIONS ──────────────────────────────────────────
const NOTIFICATION_STYLES = {
  RECLAMATION: {
    icon: AlertCircle,
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5"
  },
  FIN_DE_VIE: {
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fcd34d"
  },
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

// ─── COMPOSANT HEADER ──────────────────────────────────────────────────
export function Header({ sidebarOpen, setSidebarOpen }) {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  
  // Popup notification
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [agent, setAgent] = useState(null);

  const location = useLocation();
  const currentPath = location.pathname;
  const wsSubscriptionRef = useRef(null);
  const popupTimerRef = useRef(null);

  // ─── Chargement de l'agent ──────────────────────────────────────────────
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const savedAgent = getAgent();
        if (savedAgent) {
          setAgent(savedAgent);
        }
      } catch (error) {
        console.error("Erreur chargement agent:", error);
        setAgent(null);
      } finally {
        setIsLoadingAgent(false);
      }
    };
    loadAgent();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const unreadNotifs = await getUnreadNotifications();
      const count = await getUnreadCount();
      
      setNotifications(unreadNotifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("❌ Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    const success = logoutAgent();
    if (success) {
      setAgent(null);
      toast.success("Déconnexion réussie");
    }
  };

  // ─── Mise à jour du compteur ─────────────────────────────────────────
  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("❌ Erreur mise à jour compteur:", error);
    }
  }, []);

  // ─── Marquer une notification comme lue ──────────────────────────────
  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (currentNotification && currentNotification.id === id) {
        setCurrentNotification(null);
        setShowPopup(false);
      }
      
      toast.success("✅ Notification marquée comme lue");
    } catch (error) {
      console.error("❌ Erreur marquage:", error);
      toast.error("Impossible de marquer comme lue");
    }
  }, [currentNotification]);

  // ─── Marquer toutes comme lues ──────────────────────────────────────
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
      toast.success("✅ Toutes les notifications sont lues");
    } catch (error) {
      console.error("❌ Erreur marquage toutes:", error);
      toast.error("Impossible de marquer toutes comme lues");
    }
  }, []);

  // ─── Gestion des notifications WebSocket ─────────────────────────────
  const handleNewNotification = useCallback((notification) => {
    console.log("📨 Nouvelle notification reçue:", notification);
    
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    setCurrentNotification(notification);
    setShowPopup(true);
    
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
    popupTimerRef.current = setTimeout(() => {
      setShowPopup(false);
    }, 6000);
  }, []);

  // ─── Initialisation WebSocket ────────────────────────────────────────
  useEffect(() => {
    loadNotifications();
    
    import("../../services/NotificationService").then(module => {
      const { startNotificationService, getNotificationStatus } = module;
      
      if (!getNotificationStatus()) {
        startNotificationService();
      }
      
      const handleWebSocketMessage = (event) => {
        try {
          const notification = JSON.parse(event.detail);
          handleNewNotification(notification);
        } catch (error) {
          console.error("❌ Erreur parsing message WebSocket:", error);
        }
      };
      
      window.addEventListener('new-notification', handleWebSocketMessage);
      
      return () => {
        window.removeEventListener('new-notification', handleWebSocketMessage);
        if (popupTimerRef.current) {
          clearTimeout(popupTimerRef.current);
        }
      };
    });
    
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [loadNotifications, handleNewNotification]);

  // ─── Mise à jour périodique du compteur ──────────────────────────────
  useEffect(() => {
    const interval = setInterval(updateUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [updateUnreadCount]);

  // ─── Fermer la popup ─────────────────────────────────────────────────
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
  }, []);

  // ─── Ouvrir la liste des notifications ──────────────────────────────
  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
    setUserDropOpen(false);
    
    if (!showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, loadNotifications]);

  // ─── Formater le temps ───────────────────────────────────────────────
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

  const currentItem = BREADCRUMB_ITEMS.find((item) => item.path === currentPath) || {
    parent: "",
    label: "Page",
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // ─── Obtenir les initiales de l'agent ──────────────────────────────────
  const getInitials = () => {
    if (!agent || !agent.nom) return "??";
    // Prendre la première lettre du nom
    return agent.nom.charAt(0).toUpperCase();
  };

  // ─── Obtenir le nom complet ─────────────────────────────────────────────
  const getAgentFullName = () => {
    if (!agent) return "Utilisateur";
    return agent.nom || "Utilisateur";
  };

  // ─── Obtenir le poste ──────────────────────────────────────────────────
  const getAgentPoste = () => {
    if (!agent) return "Non défini";
    return agent.poste?.replace("AGENT_", "") || agent.poste || "Non défini";
  };

  // ─── Obtenir l'email ──────────────────────────────────────────────────
  const getAgentEmail = () => {
    if (!agent) return "";
    return agent.email || `${agent.nom?.toLowerCase() || 'utilisateur'}@softsys.com`;
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

          {/* ─── BOUTON NOTIFICATIONS ──────────────────────────────────── */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="navbar__icon-btn navbar__icon-btn--notif"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="navbar__notif-dot"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </button>

            {/* ─── DROPDOWN NOTIFICATIONS ────────────────────────────── */}
            {showNotifications && (
              <div 
                className="user-dropdown" 
                style={{ 
                  top: "calc(100% + 8px)", 
                  right: 0, 
                  width: "380px", 
                  padding: "0",
                  maxHeight: "450px",
                  overflow: "hidden"
                }}
              >
                <div 
                  className="user-dropdown__header" 
                  style={{ 
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e2e8f0"
                  }}
                >
                  <p className="user-dropdown__name" style={{ fontSize: "14px", fontWeight: 600 }}>
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="destructive" style={{ marginLeft: "8px", fontSize: "10px" }}>
                        {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      Tout lire
                    </button>
                  )}
                </div>

                <div 
                  className="user-dropdown__menu" 
                  style={{ 
                    padding: "8px",
                    maxHeight: "350px",
                    overflowY: "auto"
                  }}
                >
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                      Chargement...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ 
                      textAlign: "center", 
                      padding: "30px 20px",
                      color: "#94a3b8"
                    }}>
                      <Bell size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: "13px" }}>Aucune notification non lue</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const style = NOTIFICATION_STYLES[notif.type] || NOTIFICATION_STYLES.default;
                      const Icon = style.icon;
                      
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 mb-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                          style={{ 
                            background: "white",
                            border: "1px solid #f1f5f9",
                            position: "relative"
                          }}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: style.bg,
                              flexShrink: 0
                            }}>
                              <Icon style={{ color: style.color, width: "16px", height: "16px" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Badge 
                                  variant={notif.type === "RECLAMATION" ? "destructive" : "outline"}
                                  style={{ fontSize: "8px", padding: "1px 6px" }}
                                >
                                  {notif.type || "Général"}
                                </Badge>
                                <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                                  {formatTime(notif.createdAt || notif.time)}
                                </span>
                              </div>
                              <p style={{ 
                                fontSize: "12px", 
                                color: "#1e293b",
                                marginTop: "2px",
                                fontWeight: 500
                              }}>
                                {notif.message || notif.titre || notif.title}
                              </p>
                              {notif.codeBarre && (
                                <p style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                                  📦 {notif.codeBarre}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                color: "#94a3b8",
                                borderRadius: "4px",
                                flexShrink: 0
                              }}
                              title="Marquer comme lue"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <div style={{
                  padding: "8px 16px",
                  borderTop: "1px solid #e2e8f0",
                  textAlign: "center"
                }}>
                  <Link 
                    to="/notifications" 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setShowNotifications(false)}
                  >
                    Voir toutes les notifications
                  </Link>
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
                {getInitials()}
              </div>
              <div className="user-btn__info">
                <span className="user-btn__name">{getAgentFullName()}</span>
                <span className="user-btn__role">{getAgentPoste()}</span>
              </div>
              <ChevronDown className={`user-btn__chevron ${userDropOpen ? "user-btn__chevron--open" : ""}`} />
            </button>

            {userDropOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown__header">
                  <p className="user-dropdown__name">{getAgentFullName()}</p>
                  <p className="user-dropdown__email">{getAgentEmail()}</p>
                </div>
                <div className="user-dropdown__menu">
                  <Link to="/" className="user-dropdown__link" onClick={() => setUserDropOpen(false)}>
                    Tableau de bord
                  </Link>
                  <Link to="/parametres" className="user-dropdown__link" onClick={() => setUserDropOpen(false)}>
                    Paramètres
                  </Link>
                  <Link to="/process" className="user-dropdown__link user-dropdown__link--danger" onClick={() => handleLogout()}>
                    Déconnexion
                  </Link>
                  <div className="user-dropdown__separator" />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── POPUP DE NOTIFICATION EN TEMPS RÉEL ──────────────────────── */}
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
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 6, ease: "linear" }}
              style={{
                height: "3px",
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                position: "absolute",
                top: 0,
                left: 0
              }}
            />

            <div style={{ padding: "16px 20px" }}>
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
                      {currentNotification.message || currentNotification.titre || currentNotification.title}
                    </p>
                    {currentNotification.codeBarre && (
                      <p style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        marginTop: "2px"
                      }}>
                        📦 Code: {currentNotification.codeBarre}
                      </p>
                    )}
                    <p style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginTop: "4px"
                    }}>
                      {formatTime(currentNotification.createdAt || currentNotification.time)}
                    </p>
                  </div>
                </div>

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
                    if (currentNotification?.id) {
                      handleMarkAsRead(currentNotification.id);
                    }
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
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          padding: 0 4px;
        }
        
        .user-dropdown__menu::-webkit-scrollbar {
          width: 4px;
        }
        .user-dropdown__menu::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .user-dropdown__menu::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}