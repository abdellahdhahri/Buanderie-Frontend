
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/layout";
import { ProtectedLayout } from "./services/ProtectedLayout";
import ProcessList from "./pages/auth/auth";
import DashboardBuanderie from "./pages/Dashboard/BuanderieDashboard";
import LingeList from "./pages/Linge/LingeList";
import LavageList from "./pages/lavage/LavageList";
import ColageList from "./pages/collage/ColageList";
import SechageList from "./pages/sechage/SechageList";
import PliageList from "./pages/Pliage/PliageList";
import LivraisonList from "./pages/livraison/LivraisonList";
import ReceptionList from "./pages/Reception/ReceptionList";
import HistoriqueGlobal from "./pages/Historique/HistoriqueGlobal";
import BuanderieStats from "./pages/Statistiques/BuanderieStats";
import ReclamationList from "./pages/Reclamation/ReclamationList";
import TrackingPage from "./pages/Tracking/TrackingPage";
import StockageArsenal from "./pages/stockageArsenal/StockageArsenal";
import SuiviStock from "./pages/suiviStock/SuiviStock";
import TriList from "./pages/Tri/TriList";
import HistoriqueCollecte from "./pages/HistoriqueCollecte/HistoriqueCollecte";
import MachinesDashboard from "./pages/lavage/MachinesDashboard";
import BacList from "./pages/bac/BacList";
import LotList from "./pages/lots/LotList";
import ImmobilisationList from "./pages/Immobilisation/ImmobilisationList";
import CollageListUniforme from "./pages/collage/collecteUniforme/CollageListUniforme";
import CollageListService from "./pages/collage/collecteService/CollageListService";
import CollecteList from "./pages/collage/DashboardCollecte/CollecteList";
import ProgrammeList from "./pages/programmes/ProgrammeList";
import DistributionUniforme from "./pages/livraison/DistributionUniforme";
import DistributionList from "./pages/livraison/DistributionList";
import DistributionChambre from "./pages/livraison/DistributionChambre";
import AgentList from "./pages/Agent/AgentList";
import MachineList from "./pages/Machine/MachineList";
import ArsenalList from "./pages/Arsenal/ArsenalList";
import CycleLavageList from "./pages/CycleLavge/CycleLavageList";
import ChambreList from "./pages/chambre/ChambreList";
import InventaireArsenal from "./pages/inventaire/InventaireArsenal";
import RemiseLinge from "./pages/remise-Linges/RemiseLinge";
import EtapeList from "./pages/etape/EtapeList";
import BuanderieWorkflow from "./pages/workflow/BuanderieWorkflow";
import SacInfecteList from "./pages/sacLinge/SacInfecteList";
import ParametresPage from "./pages/Parametres/ParametresPage";
import ServiceList from "./pages/Services/ServiceList";
import { SiCircuitInfecte } from "./components/layout/SiCircuitInfecte";


export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: ProcessList,
  },

  {
    path: "/",
    Component: ProtectedLayout,

    children: [
      {
        Component: Layout,

        children: [

          
          {
            index: true,
            Component: DashboardBuanderie,
            handle: {
              privileges: ["LIG0"],
            },
          },
          


          

          {
            path: "collecteList",
            Component: CollecteList,
            handle: {
              privileges: ["LIG1501"],
            },
          },
          
          {
            path: "proc",
            Component: BuanderieWorkflow,
            handle: {
              privileges: ["LIG1501"],
            },
          },
           {
            path: "arsenal",
            Component: ArsenalList,
            handle: {
              privileges: ["LIG1501"],
            },
          },
             {
            path: "linges",
            Component: LingeList,
            handle: {
              privileges: ["LIG1501"],
            },
          },

          {
            path: "Receptions",
            Component: ReceptionList,
            handle: {
              privileges: ["LIG1502"],
            },
          },
           {
            path: "etape",
            Component: EtapeList,
            handle: {
              privileges: ["LIG1502"],
            },
          },

          {
            path: "tri",
            Component: TriList,
            handle: {
              privileges: ["LIG1503"],
            },
          },

          {
            path: "Lavages",
            Component: LavageList,
            handle: {
              privileges: ["LIG1504"],
            },
          },



          {
            path: "Sechages",
            Component: SechageList,
            handle: {
              privileges: ["LIG1601"],
            },
          },

          {
            path: "Pliages",
            Component: PliageList,
            handle: {
              privileges: ["LIG1602"],
            },
          },

          {
            path: "stockage-arsenal",
            Component: StockageArsenal,
            handle: {
              privileges: ["LIG1603"],
            },
          },

          {
            path: "Livraisons",
            Component: LivraisonList,
            handle: {
              privileges: ["LIG1604"],
            },
          },

          {
            path: "distribution",
            Component: DistributionList,
            handle: {
              privileges: ["LIG1605"],
            },
          },



          {
            path: "services",
            Component: ServiceList,
            handle: {
              privileges: ["LIG1201"],
            },
          },
          {
            path: "bac",
            Component: BacList,
            handle: {
              privileges: ["LIG1201"],
            },
          },

          {
            path: "lot",
            Component: LotList,
            handle: {
              privileges: ["LIG1202"],
            },
          },

          {
            path: "machine",
            Component: MachineList,
            handle: {
              privileges: ["LIG1203"],
            },
          },
           {
            path: "sacs",
            // Masqué pour un hôtel (pas de circuit infecté)
            element: <SiCircuitInfecte><SacInfecteList /></SiCircuitInfecte>,
            handle: {
              privileges: ["LIG1203"],
            },
          },

          {
            path: "programme",
            Component: ProgrammeList,
            handle: {
              privileges: ["LIG1204"],
            },
          },

          {
            path: "agents",
            Component: AgentList,
            handle: {
              privileges: ["LIG1204"],
            },
          },


        

          {
            path: "tracking",
            Component: TrackingPage,
            handle: {
              privileges: ["LIG1301"],
            },
          },

          {
            path: "cycleLavage",
            Component: CycleLavageList,
            handle: {
              privileges: ["LIG1302"],
            },
          },

          {
            path: "chambre",
            Component: ChambreList,
            handle: {
              privileges: ["LIG1303"],
            },
          },

          {
            path: "immo",
            Component: ImmobilisationList,
            handle: {
              privileges: ["LIG1304"],
            },
          },

          {
            path: "suivi-stock",
            Component: SuiviStock,
            handle: {
              privileges: ["LIG1305"],
            },
          },

          {
            path: "inventaire",
            Component: InventaireArsenal,
            handle: {
              privileges: ["LIG1305"],
            },
          },


          {
            path: "Historiques",
            Component: HistoriqueGlobal,
            handle: {
              privileges: ["LIG1401"],
            },
          },

          {
            path: "Statistiques",
            Component: BuanderieStats,
            handle: {
              privileges: ["LIG1402"],
            },
          },

          {
            path: "Reclamations",
            Component: ReclamationList,
            handle: {
              privileges: ["LIG1403"],
            },
          },

          {
            path: "collecte",
            Component: HistoriqueCollecte,
            handle: {
              privileges: ["LIG1404"],
            },
          },



          {
            path: "ReclamationsGestion",
            Component: ReclamationList,
            handle: {
              privileges: ["LIG11"],
            },
          },


          
          {
            path: "process",
            Component: ProcessList,
            handle: {
              privileges: ["LIG01"],
            },
          },

          {
            path: "machines",
            Component: MachinesDashboard,
            handle: {
              privileges: ["LIG1203"],
            },
          },

          {
            path: "uniforme",
            Component: CollageListUniforme,
            handle: {
              privileges: ["LIG1501"],
            },
          },

          {
            path: "service",
            Component: CollageListService,
            handle: {
              privileges: ["LIG1501"],
            },
          },
          ,

          {
            path: "uniforme",
            Component: CollageListUniforme,
            handle: {
              privileges: ["LIG1605"],
            },
          },

          {
            path: "Collages",
            Component: ColageList,
            handle: {
              privileges: ["LIG1501"],
            },
          },

          {
            path: "distUniforme",
            Component: DistributionUniforme,
            handle: {
              privileges: ["LIG1605"],
            },
          },

          {
            path: "distChambre",
            Component: DistributionChambre,
            handle: {
              privileges: ["LIG1605"],
            },
          },

          {
            path: "remise",
            Component: RemiseLinge,
            handle: {
              privileges: ["LIG1604"],
            },
          },

          {
            // Écran Paramètres : réservé à l'administrateur (tous les privilèges)
            path: "parametres",
            Component: ParametresPage,
            handle: { adminOnly: true },
          },

        ],
      },
    ],
  },
]);
