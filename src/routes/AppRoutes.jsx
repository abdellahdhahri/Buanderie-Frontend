
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout/Layout";
import { ProtectedLayout } from "../components/PrivateRoute";
import ProcessList from "../components/pages/Auth/auth";
import DashboardBuanderie from "../components/pages/Dashboard/BuanderieDashboard";
import LingeList from "../components/pages/Linge/LingeList";
import LavageList from "../components/pages/Lavage/LavageList";
import ColageList from "../components/pages/Collecte/ColageList";
import SechageList from "../components/pages/Sechage/SechageList";
import PliageList from "../components/pages/Pliage/PliageList";
import LivraisonList from "../components/pages/Livraison/LivraisonList";
import ReceptionList from "../components/pages/Reception/ReceptionList";
import HistoriqueGlobal from "../components/pages/Historique/HistoriqueGlobal";
import BuanderieStats from "../components/pages/Statistiques/BuanderieStats";
import ReclamationList from "../components/pages/Reclamation/ReclamationList";
import TrackingPage from "../components/pages/Tracking/TrackingPage";
import StockageArsenal from "../components/pages/StockageArsenal/StockageArsenal";
import SuiviStock from "../components/pages/SuiviStock/SuiviStock";
import LingesBloquesPage from "../components/pages/LingesBloques/LingesBloquesPage";
import TriList from "../components/pages/Tri/TriList";
import HistoriqueRemisesList from "../components/pages/HistoriqueRemises/HistoriqueRemisesList";
import HistoriqueCollecte from "../components/pages/HistoriqueCollecte/HistoriqueCollecte";
import MachinesDashboard from "../components/pages/Lavage/MachinesDashboard";
import ReferentielsHub from "../components/pages/Referentiels/ReferentielsHub";
import BacList from "../components/pages/Bac/BacList";
import ImmobilisationList from "../components/pages/Immobilisation/ImmobilisationList";
import CollageListUniforme from "../components/pages/Collecte/collecteUniforme/CollageListUniforme";
import CollageListService from "../components/pages/Collecte/collecteService/CollageListService";
import CollecteList from "../components/pages/Collecte/DashboardCollecte/CollecteList";
import ProgrammeList from "../components/pages/Programmes/ProgrammeList";
import ProduitNettoyageList from "../components/pages/ProduitsNettoyage/ProduitNettoyageList";
import DistributionUniforme from "../components/pages/Livraison/DistributionUniforme";
import DistributionList from "../components/pages/Livraison/DistributionList";
import DistributionChambre from "../components/pages/Livraison/DistributionChambre";
import AffectationAgents from "../components/pages/Agent/AffectationAgents";
import AgentList from "../components/pages/Agent/AgentList";
import MachineList from "../components/pages/Machine/MachineList";
import ArsenalList from "../components/pages/Arsenal/ArsenalList";
import CycleLavageList from "../components/pages/CycleLavage/CycleLavageList";
import ChambreList from "../components/pages/Chambre/ChambreList";
import InventaireArsenal from "../components/pages/Inventaire/InventaireArsenal";
import RemiseLinge from "../components/pages/RemiseLinge/RemiseLinge";
import EtapeList from "../components/pages/Etape/EtapeList";
import Processus from "../components/pages/Processus/Processus";
import BuanderieWorkflow from "../components/pages/Workflow/BuanderieWorkflow";
import { PAGES_PARAMETRES, PageParametres, HubParametres } from "../components/pages/Parametres/ParametresPages";
import { Navigate } from "react-router-dom";
import ServiceList from "../components/pages/Services/ServiceList";
import { SiEtapeActive, SiEtapeInactive } from "../components/Layout/SiEtapeActive";
import ChargementPesee from "../components/pages/Chargement/ChargementPesee";


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
            path: "processus",
            Component: Processus,
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
            element: <SiEtapeActive code="TRI"><TriList /></SiEtapeActive>,
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
            path: "chargement",
            element: <SiEtapeInactive code="TRI"><ChargementPesee /></SiEtapeInactive>,
            handle: {
              privileges: ["LIG1504"],
            },
          },

          {
            path: "Sechages",
            element: <SiEtapeActive code="SECHAGE"><SechageList /></SiEtapeActive>,
            handle: {
              privileges: ["LIG1601"],
            },
          },

          {
            path: "Pliages",
            element: <SiEtapeActive code="PLIAGE"><PliageList /></SiEtapeActive>,
            handle: {
              privileges: ["LIG1602"],
            },
          },

          {
            path: "stockage-arsenal",
            element: <SiEtapeActive code="STOCKAGE"><StockageArsenal /></SiEtapeActive>,
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
            path: "referentiels",
            Component: ReferentielsHub,
            handle: {
              privileges: ["LIG12"],
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
            path: "bacs-tri",
            Component: BacList,
            handle: {
              privileges: ["LIG1201"],
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
            path: "programme",
            Component: ProgrammeList,
            handle: {
              privileges: ["LIG1204"],
            },
          },

          {
            path: "produits-nettoyage",
            Component: ProduitNettoyageList,
            handle: {
              privileges: ["LIG1204"],
            },
          },

          {
            path: "affectation-agents",
            Component: AffectationAgents,
            handle: { adminOnly: true },
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
            path: "linges-bloques",
            Component: LingesBloquesPage,
            handle: {
              privileges: ["LIG1305"],
            },
          },


          {
            path: "historique-livraisons",
            Component: HistoriqueRemisesList,
            handle: {
              privileges: ["LIG1404"],
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


          { path: "parametres", element: <HubParametres />, handle: { adminOnly: true } },
          ...PAGES_PARAMETRES.map((page) => ({
            path: `parametres/${page.path}`,
            element: <PageParametres page={page} />,
            handle: { adminOnly: true },
          })),

        ],
      },
    ],
  },
]);
