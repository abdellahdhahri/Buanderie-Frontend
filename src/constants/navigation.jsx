import React from "react";
import {
  IconDashboard, IconSettings, IconHospital, IconBin, IconSteps, IconBundle, IconInfectedBag, IconMachines, IconProgram, IconShelves, IconMonitoring, IconTracking, IconWashCycle, IconBed, IconMachineStatus, IconInventory, IconGarment, IconDirtyZone, IconCollect, IconReception, IconSort, IconWashing, IconCleanZone, IconDrying, IconFolded, IconDelivery, IconDistribution, IconReporting, IconHistory, IconStats, IconComplaint, IconCollectHistory,
} from "../components/Layout/sidebarIcons";

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
        label: "Services",
        path: "/services",
        privilege: "LIG1201",
        icon: <IconHospital />,
      },
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
  infecte: true,
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
        etape: "TRI",
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
      {
        label: "Chargement (pesée)",
        path: "/chargement",
        privilege: "LIG1504",
        icon: <IconBundle />,
        siEtapeInactive: "TRI",
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
        etape: "SECHAGE",
        path: "/Sechages",
        privilege: "LIG1601",
        icon: <IconDrying />,
      },
      {
        label: "Pliage",
        etape: "PLIAGE",
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
        etape: "STOCKAGE",
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

export function sansCircuitInfecte(items) {
  return items
    .filter((item) => !item.infecte)
    .map((item) => (item.children ? { ...item, children: sansCircuitInfecte(item.children) } : item));
}

export function filtrerParEtapes(items, estActive) {
  const visible = (item) => (!item.etape || estActive(item.etape)) && (!item.siEtapeInactive || !estActive(item.siEtapeInactive));
  return items
    .filter(visible)
    .map((item) => (item.children ? { ...item, children: filtrerParEtapes(item.children, estActive) } : item))
    .filter((item) => !item.children || item.children.length);
}

export function filterNavByPrivileges(items, privileges = []) {
  const hasFullAccess = privileges.includes("ADMIN") || privileges.includes("ALL");
  const hasPrivilege = (code) => !code || hasFullAccess || privileges.includes(code);

  return items
    .map((item) => {
      if (!hasPrivilege(item.privilege)) return null;
      if (!item.children) return item;
      const children = item.children.filter((child) => hasPrivilege(child.privilege));
      return children.length ? { ...item, children } : null;
    })
    .filter(Boolean);
}
