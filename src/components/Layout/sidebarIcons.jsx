// ═══════════════════════════════════════════════════════════════════════════
// Icônes du menu — jeu cohérent : grille 24, trait 1.7 arrondi,
// remplissage translucide (duotone) sur la forme principale.
// Taille par défaut 22px (.sidebar-icon), surchargeable par le CSS du parent.
// ═══════════════════════════════════════════════════════════════════════════

// Remplissage translucide de la forme principale
const tint = { fill: "currentColor", fillOpacity: 0.16 };
// Petit point plein
const dot = { fill: "currentColor", stroke: "none" };

function Icon({ children, className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`sidebar-icon ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── Sections principales ──────────────────────────────────────────────── */

// Tableau de bord : tuiles
export const IconDashboard = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7.5" height="9" rx="2" {...tint} />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
    <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" {...tint} />
    <rect x="3" y="15" width="7.5" height="6" rx="2" />
  </Icon>
);

// Paramétrage : curseurs de réglage
export const IconSettings = (p) => (
  <Icon {...p}>
    <path d="M4 6.5h8.5M17.5 6.5H20M4 12h2.5M11.5 12H20M4 17.5h10M19 17.5h1" />
    <circle cx="15" cy="6.5" r="2.5" {...tint} />
    <circle cx="9" cy="12" r="2.5" {...tint} />
    <circle cx="16.5" cy="17.5" r="2.5" {...tint} />
  </Icon>
);

// Suivi : moniteur d'activité
export const IconMonitoring = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3.5" {...tint} />
    <path d="M6.5 12.5h2.5l1.8-3.5 2.6 7 1.8-3.5h2.3" />
  </Icon>
);

// Zone sale : panier de linge à laver
export const IconDirtyZone = (p) => (
  <Icon {...p}>
    <path d="M4 10.5h16l-1.5 8.7a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8L4 10.5Z" {...tint} />
    <path d="M6.5 10.5c.3-2.4 2.2-3.8 4.2-3.3.9-2 3.9-2.1 5 .1 1.6 0 2.7 1.4 2.3 3.2" />
    <path d="M9 13.5v4.5M12 13.5v4.5M15 13.5v4.5" />
  </Icon>
);

// Zone propre : éclats de propreté
export const IconCleanZone = (p) => (
  <Icon {...p}>
    <path d="M11 3.5l1.8 4.7 4.7 1.8-4.7 1.8L11 16.5l-1.8-4.7L4.5 10l4.7-1.8Z" {...tint} />
    <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    <path d="M5.5 17v3M4 18.5h3" />
  </Icon>
);

// Reporting : rapport avec histogramme
export const IconReporting = (p) => (
  <Icon {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" {...tint} />
    <path d="M8.5 17v-3M12 17v-6.5M15.5 17V8" />
  </Icon>
);

/* ── Paramétrage ───────────────────────────────────────────────────────── */

// Bacs : bac de collecte
export const IconBin = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="3.5" rx="1.5" />
    <path d="M5 8.5h14l-1.2 10.7a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8.5Z" {...tint} />
    <path d="M10 12v5.5M14 12v5.5" />
  </Icon>
);

// Services : bâtiment hospitalier avec croix
export const IconHospital = (p) => (
  <Icon {...p}>
    <path d="M4 21V7.5A1.5 1.5 0 0 1 5.5 6H9V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6h3.5A1.5 1.5 0 0 1 20 7.5V21Z" {...tint} />
    <path d="M12 6.5v4M10 8.5h4" />
    <path d="M3 21h18M10 21v-4h4v4" />
  </Icon>
);

// Étapes : circuit en étapes
export const IconSteps = (p) => (
  <Icon {...p}>
    <circle cx="6" cy="5.5" r="2.5" {...tint} />
    <circle cx="18" cy="12" r="2.5" />
    <circle cx="6" cy="18.5" r="2.5" {...tint} />
    <path d="M8.3 6.6l7.4 4.2M15.7 13.2l-7.4 4.2" />
  </Icon>
);

export const IconBundle = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="14.5" width="17" height="6" rx="2" {...tint} />
    <rect x="4.5" y="9" width="15" height="5.5" rx="2" />
    <rect x="5.5" y="3.5" width="13" height="5.5" rx="2" {...tint} />
    <path d="M12 3.5v17" />
  </Icon>
);

// Machines : parc de machines
export const IconMachines = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="4.5" width="8.5" height="15" rx="2" />
    <rect x="13" y="4.5" width="8.5" height="15" rx="2" />
    <path d="M2.5 8h8.5M13 8h8.5" />
    <circle cx="6.75" cy="13.5" r="2.6" {...tint} />
    <circle cx="17.25" cy="13.5" r="2.6" {...tint} />
  </Icon>
);

// Programmes : sélecteur de programme
export const IconProgram = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="5" {...tint} />
    <path d="M12 12l2.6-2.6" />
    <path d="M12 3.5V5M20.5 12H19M12 20.5V19M3.5 12H5M18 6l-1 1M6 6l1 1M18 18l-1-1M6 18l1-1" />
  </Icon>
);

// Stock : étagères
export const IconShelves = (p) => (
  <Icon {...p}>
    <path d="M4 3v18M20 3v18M4 10.5h16M4 18h16" />
    <rect x="6.5" y="5" width="5" height="5.5" rx="1" {...tint} />
    <rect x="13" y="12.5" width="5" height="5.5" rx="1" {...tint} />
    <rect x="7" y="13.5" width="4" height="4.5" rx="1" />
  </Icon>
);

/* ── Suivi ─────────────────────────────────────────────────────────────── */

// Tracking : repère de localisation
export const IconTracking = (p) => (
  <Icon {...p}>
    <path d="M12 21.5s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10.5c0 5.4-6.5 11-6.5 11Z" {...tint} />
    <circle cx="12" cy="10.5" r="2.3" />
  </Icon>
);

// Cycles de lavage : rotation + goutte d'eau
export const IconWashCycle = (p) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.8M4 13a8 8 0 0 0 14.3 4.8" />
    <path d="M5.5 2.8v3.7h3.7M18.5 21.2v-3.7h-3.7" />
    <path d="M12 8.8s-2.4 2.7-2.4 4.2a2.4 2.4 0 0 0 4.8 0c0-1.5-2.4-4.2-2.4-4.2Z" {...tint} />
  </Icon>
);

// Chambres : lit
export const IconBed = (p) => (
  <Icon {...p}>
    <path d="M3 5v14M21 19v-6.5a3 3 0 0 0-3-3h-7.5V14" />
    <path d="M3 14h18v3H3Z" {...tint} />
    <rect x="5" y="9.5" width="4" height="3" rx="1.5" {...tint} />
  </Icon>
);

// État des machines : machine + voyant de statut
export const IconMachineStatus = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="13" height="18" rx="2.5" />
    <path d="M3 7.5h13" />
    <circle cx="9.5" cy="14" r="3.5" {...tint} />
    <circle cx="18.5" cy="6.5" r="3" {...tint} />
    <path d="M17.2 6.6l.9.9 1.6-1.8" />
  </Icon>
);

// Inventaire : presse-papiers avec liste cochée
export const IconInventory = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="4" width="15" height="17.5" rx="2.5" {...tint} />
    <rect x="8.5" y="2.5" width="7" height="3.5" rx="1.2" />
    <path d="M8 11.2l1.3 1.3 2.2-2.4M14 11.5h2.5M8 16.2l1.3 1.3 2.2-2.4M14 16.5h2.5" />
  </Icon>
);

// Linges : tunique
export const IconGarment = (p) => (
  <Icon {...p}>
    <path d="M9 3.5 5 5.5 2.5 10l3 1.8 1.5-1.2v10h10v-10l1.5 1.2 3-1.8L19 5.5l-4-2a3 3 0 0 1-6 0Z" {...tint} />
  </Icon>
);

/* ── Zone sale ─────────────────────────────────────────────────────────── */

// Collecte : chariot de collecte
export const IconCollect = (p) => (
  <Icon {...p}>
    <path d="M7.3 7.5H20l-2 7.5H8.8Z" {...tint} />
    <path d="M2.5 4h2.8l2.4 11h10.3" />
    <circle cx="9.5" cy="19" r="1.7" />
    <circle cx="16.5" cy="19" r="1.7" />
  </Icon>
);

// Réception : bac d'arrivée
export const IconReception = (p) => (
  <Icon {...p}>
    <path d="M3 13.5 5.3 5.8A2 2 0 0 1 7.2 4.5h9.6a2 2 0 0 1 1.9 1.3L21 13.5v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...tint} />
    <path d="M3 13.5h4.5L9 16h6l1.5-2.5H21" />
    <path d="M12 7.5v5M9.8 10.3 12 12.5l2.2-2.2" />
  </Icon>
);

// Tri : aiguillage
export const IconSort = (p) => (
  <Icon {...p}>
    <path d="M12 21v-7M12 14 6 8M12 14l6-6" />
    <path d="M5.5 11.5v-4h4M18.5 11.5v-4h-4" />
    <circle cx="12" cy="14" r="2" {...tint} />
  </Icon>
);

// Lavage : machine à laver
export const IconWashing = (p) => (
  <Icon {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
    <path d="M4 7h16" />
    <circle cx="7" cy="4.8" r=".7" {...dot} />
    <circle cx="9.5" cy="4.8" r=".7" {...dot} />
    <circle cx="12" cy="14" r="4.7" {...tint} />
    <path d="M8.2 14.6c1.3-.9 2.5-.9 3.8 0s2.5.9 3.8 0" />
  </Icon>
);

/* ── Zone propre ───────────────────────────────────────────────────────── */

// Séchage : souffle d'air
export const IconDrying = (p) => (
  <Icon {...p}>
    <path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 12.5h15.5a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 16.5h6.5a2 2 0 1 1-2 2" />
  </Icon>
);

// Pliage : serviettes pliées
export const IconFolded = (p) => (
  <Icon {...p}>
    <path d="M4 5.5h12.5a3 3 0 0 1 0 6H4Z" {...tint} />
    <path d="M4 12.5h13.5a3 3 0 0 1 0 6H4Z" />
    <path d="M7 8.5h7M7 15.5h8" />
  </Icon>
);

// Stockage : caisse d'archivage
export const IconStorage = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1.5" {...tint} />
    <path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9" />
    <path d="M10 13h4" />
  </Icon>
);

// Livraison : camion
export const IconDelivery = (p) => (
  <Icon {...p}>
    <path d="M2.5 6.5a1 1 0 0 1 1-1H14v10.5H2.5Z" {...tint} />
    <path d="M14 9h4l3.5 3.5V16H14" />
    <circle cx="6.5" cy="17.5" r="2" />
    <circle cx="17.5" cy="17.5" r="2" />
  </Icon>
);

// Distribution : envoi vers les services
export const IconDistribution = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12.5" r="3" {...tint} />
    <path d="M12 9.5V3.5M9.8 5.7 12 3.5l2.2 2.2" />
    <path d="M9.4 14 4.5 17M4.2 14.2 4.5 17l2.8.3" />
    <path d="M14.6 14l4.9 3M19.8 14.2l-.3 2.8-2.8.3" />
  </Icon>
);

/* ── Reporting ─────────────────────────────────────────────────────────── */

// Historique : horloge à rebours
export const IconHistory = (p) => (
  <Icon {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3 3.5V8h4.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

// Statistiques : courbe de tendance
export const IconStats = (p) => (
  <Icon {...p}>
    <path d="M7.5 15l3.5-4 3 2.5 5-6V18H7.5Z" fill="currentColor" fillOpacity={0.16} stroke="none" />
    <path d="M3.5 3.5v15a2 2 0 0 0 2 2h15" />
    <path d="M7.5 15l3.5-4 3 2.5 5-6" />
  </Icon>
);

// Réclamations : bulle avec alerte
export const IconComplaint = (p) => (
  <Icon {...p}>
    <path d="M20.5 11.5a8 8 0 0 1-11.6 7.2L3.5 20l1.3-5A8 8 0 1 1 20.5 11.5Z" {...tint} />
    <path d="M12.5 7.8v4.2M12.5 15h.01" />
  </Icon>
);

export const IconAgents = (p) => (
  <Icon {...p}>
    <circle cx="9.5" cy="8" r="3.5" {...tint} />
    <path d="M3 19.5c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5" {...tint} />
    <path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M18 14.3c1.7.8 2.8 2.6 3 5.2" />
  </Icon>
);

export const IconBlockedLinen = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" {...tint} />
    <path d="M12 7.5V12l2.8 1.8" />
    <path d="M5.9 5.9 18.1 18.1" />
  </Icon>
);

// Historique des collectes : calendrier coché
export const IconCollectHistory = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...tint} />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M9 14.8l2 2 4-4" />
  </Icon>
);

/* ── Divers ────────────────────────────────────────────────────────────── */

// Déconnexion : porte de sortie
export const IconLogout = (p) => (
  <Icon {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 16l-4-4 4-4M6 12h10" />
  </Icon>
);

export const IconGear = (p) => (
  <Icon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" {...tint} />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
