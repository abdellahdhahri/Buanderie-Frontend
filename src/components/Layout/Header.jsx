import { useState, useEffect, useCallback, useRef  } from "react";
import { Link, useLocation ,useNavigate } from "react-router";
import { useEstablishment } from "../../hooks/useEstablishment";
import { DEFAULT_LOGO } from "../../services/establishmentService";
import { useAuth } from "../../constants/AuthContext";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";

import {
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
} from "../../services/NotificationService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logoutAgent } from "../../services/agentService";
import LanguageSwitcher from "../utils/LanguageSwitcher";
import { isDarkTheme, setDarkTheme, onThemeChange } from "../../utils/theme";
import { getBreadcrumbTrail } from "./PageHeaderIcon";
import { NAV_ITEMS } from "../../constants/navigation";
import { isAdministrateur } from "../../utils/privileges";


const Icons = {
  Menu: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  ChevronRight: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: ({ size = 14, color = "currentColor", strokeWidth = 2, className, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Bell: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Message: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Sun: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: ({ size = 18, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  X: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Check: ({ size = 14, color = "currentColor", strokeWidth = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCheck: ({ size = 14, color = "currentColor", strokeWidth = 2.5 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  ),
  Eye: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  AlertCircle: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  AlertTriangle: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Info: ({ size = 16, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  User: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Settings: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  LogOut: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Award: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  Package: ({ size = 14, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  Calendar: ({ size = 11, color = "currentColor", strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};


const NOTIFICATION_STYLES = {
  RECLAMATION: {
    Icon: Icons.AlertCircle,
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    label: "Réclamation",
  },
  FIN_DE_VIE: {
    Icon: Icons.AlertTriangle,
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fcd34d",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    label: "Fin de vie",
  },
  STOCK_UNIFORME: {
    Icon: Icons.CheckCircle,
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    label: "Stock",
  },
  ALERTE_STOCK: {
    Icon: Icons.AlertTriangle,
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fcd34d",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    label: "Alerte",
  },
  LIVRAISON: {
    Icon: Icons.Package,
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    label: "Livraison",
  },
  COLLECTE: {
    Icon: Icons.Info,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    label: "Collecte",
  },
  default: {
    Icon: Icons.Bell,
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#e2e8f0",
    gradient: "linear-gradient(135deg, #64748b, #475569)",
    label: "Notification",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 COMPOSANT HEADER
// ═══════════════════════════════════════════════════════════════════════════

export function Header({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();
  const establishment = useEstablishment();
  const { agent, admin } = useAuth();

  const [isDark, setIsDark] = useState(isDarkTheme);

  // Reste synchronisé si le thème change ailleurs (page Paramètres)
  useEffect(() => onThemeChange(setIsDark), []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredNotif, setHoveredNotif] = useState(null);

  const location = useLocation();
  const currentPath = location.pathname;
  const popupTimerRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const handleNewNotificationRef = useRef(null);

   const navigate = useNavigate();   
  const {
    privileges = [],
    logout
  } = useAuth();
  // ─── Chargement des notifications ──────────────────────────────────────
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

  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("❌ Erreur mise à jour compteur:", error);
    }
  }, []);

  // ─── Mark as read ──────────────────────────────────────────────────────
  const handleMarkAsRead = useCallback(
    async (id) => {
      try {
        await markNotificationAsRead(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (currentNotification && currentNotification.id === id) {
          setCurrentNotification(null);
          setShowPopup(false);
        }

        toast.success(t("notifications.marked_read") || "Notification marquée comme lue");
      } catch (error) {
        console.error("❌ Erreur marquage:", error);
        toast.error(t("notifications.mark_error") || "Impossible de marquer comme lue");
      }
    },
    [currentNotification, t]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
      toast.success(t("notifications.all_marked_read") || "Toutes les notifications sont lues");
    } catch (error) {
      console.error("❌ Erreur marquage toutes:", error);
      toast.error(t("notifications.mark_all_error") || "Impossible de marquer toutes comme lues");
    }
  }, [t]);

  // ✅ Ref pour éviter la closure stale (nouvelle notification temps réel)
  useEffect(() => {
    handleNewNotificationRef.current = (notification) => {
      console.log("🔔 Nouvelle notification reçue:", notification);

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setCurrentNotification(notification);
      setShowPopup(true);

      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      popupTimerRef.current = setTimeout(() => {
        setShowPopup(false);
      }, 6000);


      // ✅ Rafraîchir le compteur depuis le serveur (au cas où)
      setTimeout(() => updateUnreadCount(), 1000);
    };
  }, [updateUnreadCount]);

  // ─── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadNotifications();

    let cleanup;

    import("../../services/NotificationService").then((module) => {
      const { startNotificationService, getNotificationStatus } = module;
      if (!getNotificationStatus()) startNotificationService();

      const handleWebSocketMessage = (event) => {
        try {
          const notification = JSON.parse(event.detail);
          // ✅ Utilise la ref pour appeler la version la plus récente
          if (handleNewNotificationRef.current) {
            handleNewNotificationRef.current(notification);
          }
        } catch (error) {
          console.error("❌ Erreur parsing message WebSocket:", error);
        }
      };

      window.addEventListener("new-notification", handleWebSocketMessage);

      cleanup = () => {
        window.removeEventListener("new-notification", handleWebSocketMessage);
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const interval = setInterval(updateUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [updateUnreadCount]);

  // ─── Click outside ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setUserDropOpen(false);
    if (!showNotifications) loadNotifications();
  }, [showNotifications, loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/process');
  };

  const toggleTheme = () => {
    setDarkTheme(!isDark);
  };

  // ─── Helpers : formatage date/heure ────────────────────────────────────

  // ✅ Format court pour l'affichage principal (À l'instant / min / h / date)
  const formatTime = (timestamp) => {
    if (!timestamp) return t("time.now") || "À l'instant";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return t("time.now") || "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  // ✅ Format complet date + heure (pour affichage détaillé)
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} · ${hours}:${minutes}`;
  };

  // ✅ Récupérer la date d'une notification (plusieurs formats possibles)
  const getNotificationDate = (notif) => {
    return notif.dateCreation || notif.createdAt || notif.time || notif.date;
  };

  // Fil d'Ariane construit à partir du menu : Accueil › Section › Page
  const breadcrumbTrail = getBreadcrumbTrail(currentPath);

  const getInitials = () => {
    if (!agent) return "??";
    const nomPrenom = agent.nomPrenom || agent.login || "";
    if (!nomPrenom) return "??";
    const parts = nomPrenom.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const getAgentFullName = () => agent?.nomPrenom || agent?.login || "Utilisateur";
  const getAgentEmail = () =>
    agent?.email || `${agent?.nomPrenom?.toLowerCase() || "utilisateur"}@softsys.com`;

  return (
    <>
      <header className={`navbar ${sidebarOpen ? "navbar--shifted" : ""}`} dir="ltr">
        {/* ═══ LEFT ═══ */}
        <div className="navbar__left">
          <button className="navbar__mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icons.Menu size={18} color="currentColor" />
          </button>

          {!sidebarOpen && (
            <Link to="/" className="navbar__logo-link">
              <img
                src={establishment.logo}
                alt={establishment.nomApplication}
                style={{ height: "48px", maxWidth: "160px", objectFit: "contain" }}
                onError={(e) => { if (!e.currentTarget.src.endsWith(DEFAULT_LOGO)) e.currentTarget.src = DEFAULT_LOGO; }}
              />
            </Link>
          )}

          <nav className="navbar__breadcrumb" aria-label="breadcrumb">
            {breadcrumbTrail.length === 0 ? (
              <span className="navbar__breadcrumb-current" aria-current="page">
                {t("navigation.home", "Accueil")}
              </span>
            ) : (
              <Link to="/" className="navbar__breadcrumb-root">
                {t("navigation.home", "Accueil")}
              </Link>
            )}

            {breadcrumbTrail.map((crumb, i) => {
              const label = crumb.key ? t(crumb.key, crumb.fallback) : crumb.fallback;
              return (
                <span key={i} className="navbar__breadcrumb-item">
                  <Icons.ChevronRight size={14} color="#cbd5e1" />
                  {crumb.path ? (
                    <Link to={crumb.path} className="navbar__breadcrumb-root">{label}</Link>
                  ) : (
                    <span className="navbar__breadcrumb-current" aria-current="page">{label}</span>
                  )}
                </span>
              );
            })}
          </nav>
        </div>

        {/* ═══ RIGHT ═══ */}
        <div className="navbar__right">
          <LanguageSwitcher />

          {/* Messages */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="navbar__icon-btn"
          >
            <Icons.Message size={18} color="currentColor" />
          </motion.button>

          {/* Theme */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            className="navbar__icon-btn"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Icons.Sun size={18} color="currentColor" />
            ) : (
              <Icons.Moon size={18} color="currentColor" />
            )}
          </motion.button>

          {/* ─── BOUTON NOTIFICATIONS ──────────────────────────────── */}
          <div className="relative" ref={notifDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleNotifications}
              className="navbar__icon-btn navbar__icon-btn--notif"
            >
              <Icons.Bell size={18} color="currentColor" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="navbar__notif-dot"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* ─── DROPDOWN NOTIFICATIONS ────────────────────────────── */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="notif-dropdown"
                >
                  {/* Header */}
                  <div className="notif-dropdown__header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div className="notif-dropdown__header-icon">
                        <Icons.Bell size={16} color="white" strokeWidth={2.2} />
                      </div>
                      <div>
                        <div className="notif-dropdown__title">
                          {t("notifications.title") || "Notifications"}
                        </div>
                        {unreadCount > 0 && (
                          <div className="notif-dropdown__subtitle">
                            {unreadCount} {t("notifications.unread_label") || "non lue"}
                            {unreadCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMarkAllAsRead}
                        className="notif-dropdown__mark-all"
                      >
                        <Icons.CheckCheck size={12} color="#0d9488" />
                        <span>{t("notifications.mark_all") || "Tout lire"}</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Liste */}
                  <div className="notif-dropdown__list">
                    {loading ? (
                      <div className="notif-dropdown__loading">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ display: "inline-flex" }}
                        >
                          <Icons.Bell size={24} color="#cbd5e1" />
                        </motion.div>
                        <p>{t("common.loading") || "Chargement..."}</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notif-dropdown__empty">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="notif-dropdown__empty-icon"
                        >
                          <Icons.Check size={26} color="#10b981" strokeWidth={2.5} />
                        </motion.div>
                        <p className="notif-dropdown__empty-title">
                          {t("notifications.all_read") || "Vous êtes à jour !"}
                        </p>
                        <p className="notif-dropdown__empty-text">
                          {t("notifications.no_unread") || "Aucune notification non lue"}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif, index) => {
                        const style = NOTIFICATION_STYLES[notif.type] || NOTIFICATION_STYLES.default;
                        const NotifIcon = style.Icon;
                        const isHovered = hoveredNotif === notif.id;
                        const notifDate = getNotificationDate(notif);

                        return (
                          <motion.div
                            key={notif.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            onMouseEnter={() => setHoveredNotif(notif.id)}
                            onMouseLeave={() => setHoveredNotif(null)}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="notif-item"
                          >
                            {/* Barre latérale colorée */}
                            <div
                              className="notif-item__bar"
                              style={{ background: style.gradient }}
                            />

                            {/* Icon */}
                            <div
                              className="notif-item__icon"
                              style={{
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              <NotifIcon size={16} color={style.color} strokeWidth={2.2} />
                            </div>

                            {/* Contenu */}
                            <div className="notif-item__content">
                              <div className="notif-item__header">
                                <span
                                  className="notif-item__type"
                                  style={{
                                    color: style.color,
                                    background: `${style.color}10`,
                                    border: `1px solid ${style.color}25`,
                                  }}
                                >
                                  {t(`notifications.types.${notif.type}`, style.label)}
                                </span>
                                <span className="notif-item__time">
                                  {formatTime(notifDate)}
                                </span>
                              </div>

                              <p className="notif-item__message">
                                {notif.message || notif.titre || notif.title}
                              </p>

                              {/* ✅ Date + heure complète */}
                              {notifDate && (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    marginTop: "6px",
                                    fontSize: "10px",
                                    color: "#94a3b8",
                                    fontWeight: 600,
                                    fontFeatureSettings: "'tnum'",
                                  }}
                                >
                                  <Icons.Calendar size={11} color="#94a3b8" strokeWidth={2} />
                                  {formatDateTime(notifDate)}
                                </div>
                              )}

                              {notif.codeBarre && (
                                <div className="notif-item__code">
                                  <Icons.Package size={10} color="#94a3b8" />
                                  <span>{notif.codeBarre}</span>
                                </div>
                              )}
                            </div>

                            {/* Action au hover */}
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="notif-item__action"
                                >
                                  <Icons.Eye size={12} color="#0d9488" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="notif-dropdown__footer">
                    <Link
                      to="/notifications"
                      className="notif-dropdown__view-all"
                      onClick={() => setShowNotifications(false)}
                    >
                      <span>{t("notifications.view_all") || "Voir toutes les notifications"}</span>
                      <Icons.ChevronRight size={12} color="#0d9488" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="navbar__divider" />

          {/* ─── USER DROPDOWN ─────────────────────────────────────── */}
          <div className="relative navbar__user">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="user-btn"
              onClick={() => {
                setUserDropOpen(!userDropOpen);
                setShowNotifications(false);
              }}
            >
              <div className="user-btn__avatar">{getInitials()}</div>
              <div className="user-btn__info">
                <span className="user-btn__name">{getAgentFullName()}</span>
              </div>
              <motion.div
                animate={{ rotate: userDropOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "inline-flex" }}
              >
                <Icons.ChevronDown size={14} color="#94a3b8" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {userDropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="user-dropdown"
                >
                  <div className="user-dropdown__header">
                    <div className="user-dropdown__avatar">{getInitials()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="user-dropdown__name">{getAgentFullName()}</p>
                      <p className="user-dropdown__email">{getAgentEmail()}</p>
                    </div>
                  </div>

                  <div className="user-dropdown__menu">
                    <Link
                      to="/"
                      className="user-dropdown__link"
                      onClick={() => setUserDropOpen(false)}
                    >
                      <Icons.Award size={14} color="#64748b" />
                      <span>{t("nav.dashboard") || "Tableau de bord"}</span>
                    </Link>
                    {isAdministrateur(privileges, NAV_ITEMS) && (
                      <Link
                        to="/parametres"
                        className="user-dropdown__link"
                        onClick={() => setUserDropOpen(false)}
                      >
                        <Icons.Settings size={14} color="#64748b" />
                        <span>{t("nav.settings") || "Paramètres"}</span>
                      </Link>
                    )}

                    <div className="user-dropdown__separator" />

                    <button
                      className="user-dropdown__link user-dropdown__link--danger"
                      onClick={handleLogout}
                    >
                      <Icons.LogOut size={14} color="#dc2626" />
                      <span>{t("nav.logout") || "Déconnexion"}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          POPUP DE NOTIFICATION EN TEMPS RÉEL
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPopup &&
          currentNotification &&
          (() => {
            const style =
              NOTIFICATION_STYLES[currentNotification.type] || NOTIFICATION_STYLES.default;
            const NotifIcon = style.Icon;
            const notifDate = getNotificationDate(currentNotification);

            return (
              <motion.div
                initial={{ opacity: 0, y: -80, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -80, scale: 0.9 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                className="notif-popup"
              >
                {/* Progress bar */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="notif-popup__progress"
                  style={{ background: style.gradient }}
                />

                {/* Header */}
                <div className="notif-popup__header">
                  <div className="notif-popup__header-left">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                      className="notif-popup__icon"
                      style={{
                        background: style.gradient,
                        boxShadow: `0 8px 24px ${style.color}40`,
                      }}
                    >
                      <NotifIcon size={22} color="white" strokeWidth={2.2} />
                    </motion.div>
                    <div>
                      <div className="notif-popup__badge-row">
                        <span
                          className="notif-popup__badge"
                          style={{
                            color: style.color,
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {t(`notifications.types.${currentNotification.type}`, style.label)}
                        </span>
                        <motion.span
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="notif-popup__new-badge"
                        >
                          {t("notifications.new") || "Nouveau"}
                        </motion.span>
                      </div>
                      <p className="notif-popup__time">{formatDateTime(notifDate)}</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClosePopup}
                    className="notif-popup__close"
                  >
                    <Icons.X size={14} color="#94a3b8" />
                  </motion.button>
                </div>

                {/* Body */}
                <div className="notif-popup__body">
                  <p className="notif-popup__message">
                    {currentNotification.message ||
                      currentNotification.titre ||
                      currentNotification.title}
                  </p>

                  {currentNotification.codeBarre && (
                    <div className="notif-popup__code">
                      <Icons.Package size={12} color="#94a3b8" />
                      <span>{currentNotification.codeBarre}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="notif-popup__actions">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClosePopup}
                    className="notif-popup__btn notif-popup__btn--ghost"
                  >
                    {t("common.close") || "Fermer"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentNotification?.id) handleMarkAsRead(currentNotification.id);
                    }}
                    className="notif-popup__btn notif-popup__btn--primary"
                    style={{
                      background: style.gradient,
                      boxShadow: `0 4px 16px ${style.color}30`,
                    }}
                  >
                    <Icons.Check size={12} color="white" />
                    <span>{t("notifications.mark_as_read") || "Marquer comme lu"}</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          STYLES PREMIUM
      ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        /* ─── Notification dot ─── */
        .navbar__notif-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 9px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          padding: 0 4px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          font-feature-settings: 'tnum';
        }

        /* ═══════════════════════════════════════════════════════════════
           NOTIFICATIONS DROPDOWN
        ═══════════════════════════════════════════════════════════════ */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 400px;
          max-height: 540px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.04),
            0 20px 40px rgba(15, 23, 42, 0.12),
            0 0 0 1px rgba(15, 23, 42, 0.02);
          overflow: hidden;
          z-index: 9999;
        }

        .notif-dropdown__header {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
        }

        .notif-dropdown__header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
          flex-shrink: 0;
        }

        .notif-dropdown__title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .notif-dropdown__subtitle {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin-top: 2px;
        }

        .notif-dropdown__mark-all {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          color: #0d9488;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notif-dropdown__mark-all:hover {
          background: #ccfbf1;
          border-color: #99f6e4;
        }

        .notif-dropdown__list {
          max-height: 380px;
          overflow-y: auto;
          padding: 8px;
        }

        .notif-dropdown__list::-webkit-scrollbar {
          width: 4px;
        }
        .notif-dropdown__list::-webkit-scrollbar-track {
          background: transparent;
        }
        .notif-dropdown__list::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .notif-dropdown__list::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        .notif-dropdown__loading,
        .notif-dropdown__empty {
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .notif-dropdown__loading p {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          margin: 0;
        }

        .notif-dropdown__empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .notif-dropdown__empty-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .notif-dropdown__empty-text {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          margin: 0;
        }

        /* ─── Notif item ─── */
        .notif-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px 12px 16px;
          border-radius: 12px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }

        .notif-item:hover {
          background: #f8fafc;
          transform: translateX(2px);
        }

        .notif-item__bar {
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          border-radius: 0 3px 3px 0;
        }

        .notif-item__icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-item__content {
          flex: 1;
          min-width: 0;
        }

        .notif-item__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notif-item__type {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notif-item__time {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
          flex-shrink: 0;
          font-feature-settings: 'tnum';
        }

        .notif-item__message {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .notif-item__code {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 9px;
          color: #64748b;
          font-weight: 600;
        }

        .notif-item__action {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ─── Footer ─── */
        .notif-dropdown__footer {
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          background: linear-gradient(0deg, #fafbfc 0%, #ffffff 100%);
        }

        .notif-dropdown__view-all {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: 10px;
          color: #0d9488;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }

        .notif-dropdown__view-all:hover {
          background: #f0fdfa;
        }

        /* ═══════════════════════════════════════════════════════════════
           POPUP DE NOTIFICATION
        ═══════════════════════════════════════════════════════════════ */
        .notif-popup {
          position: fixed;
          top: 24px;
          /* Centrage sans transform : framer-motion anime transform (y, scale) */
          left: 0;
          right: 0;
          margin: 0 auto;
          z-index: 99999;
          width: 440px;
          max-width: calc(100vw - 40px);
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.04),
            0 24px 48px rgba(15, 23, 42, 0.15),
            0 0 0 1px rgba(15, 23, 42, 0.02);
        }

        .notif-popup__progress {
          height: 3px;
          width: 100%;
        }

        .notif-popup__header {
          padding: 18px 20px 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .notif-popup__header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .notif-popup__icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-popup__badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notif-popup__badge {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notif-popup__new-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 8px;
          color: white;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .notif-popup__time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          margin: 4px 0 0;
          font-feature-settings: 'tnum';
        }

        .notif-popup__close {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          background: #fafbfc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notif-popup__close:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .notif-popup__body {
          padding: 14px 20px;
        }

        .notif-popup__message {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          line-height: 1.5;
          letter-spacing: -0.01em;
        }

        .notif-popup__code {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 11px;
          color: #475569;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .notif-popup__actions {
          padding: 12px 20px 18px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .notif-popup__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          letter-spacing: -0.01em;
        }

        .notif-popup__btn--ghost {
          background: white;
          color: #64748b;
          border: 1.5px solid #e2e8f0;
        }

        .notif-popup__btn--ghost:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .notif-popup__btn--primary {
          color: white;
        }

        .notif-popup__btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        /* ═══════════════════════════════════════════════════════════════
           USER DROPDOWN
        ═══════════════════════════════════════════════════════════════ */
        .user-btn__avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
          flex-shrink: 0;
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 280px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.04),
            0 20px 40px rgba(15, 23, 42, 0.12);
          overflow: hidden;
          z-index: 9999;
        }

        .user-dropdown__header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
        }

        .user-dropdown__avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
          flex-shrink: 0;
        }

        .user-dropdown__name {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown__email {
          font-size: 11px;
          color: #94a3b8;
          margin: 2px 0 0;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown__menu {
          padding: 8px;
        }

        .user-dropdown__link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          text-align: left;
        }

        .user-dropdown__link:hover {
          background: #f0fdfa;
          color: #0d9488;
        }

        .user-dropdown__link--danger {
          color: #dc2626;
        }

        .user-dropdown__link--danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .user-dropdown__separator {
          height: 1px;
          background: #f1f5f9;
          margin: 6px 4px;
        }
      `}</style>
    </>
  );
}