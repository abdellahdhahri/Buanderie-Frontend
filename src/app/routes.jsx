import { createBrowserRouter } from "react-router";

import { Layout } from "./components/layout/layout";
import LingeList from "./pages/Linge/LingeList"
import LavageList from "./pages/lavage/LavageList";
import ColageList from "./pages/collage/ColageList";
import SechageList from "./pages/sechage/SechageList";
import PliageList from "./pages/Pliage/PliageList";
import LivraisonList from "./pages/livraison/LivraisonList";
import ReceptionList from "./pages/Reception/ReceptionList";
import HistoriqueGlobal from "./pages/Historique/HistoriqueGlobal";
import Statistiques from "./pages/Statistiques/BuanderieStats";
import ReclamationList from "./pages/Reclamation/ReclamationList";
import TrackingPage from "./pages/Tracking/TrackingPage";
import DashboardBuanderie from "./pages/Dashboard/BuanderieDashboard";
import StockageList from "./pages/stockage/StockageList";
import ProcessList from "./pages/process/ProcessList";
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
import BuanderieStats from "./pages/Statistiques/BuanderieStats";
import ArsenalList from "./pages/Arsenal/ArsenalList";
import CycleLavageList from "./pages/CycleLavge/CycleLavageList";
//import AuthentificationPage from "./pages/authentication/AuthentificationPage";
import ChambreList from "./pages/chambre/ChambreList";
import InventaireArsenal from "./pages/inventaire/InventaireArsenal";
import RemiseLinge from "./pages/remise-Linges/RemiseLinge";
//import Login from "./pages/Login/Login";
import { ProtectedLayout } from "./services/ProtectedLayout";
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

                    { index: true, Component: DashboardBuanderie },

                    { path: "Linges", Component: LingeList },
                    { path: "Lavages", Component: LavageList },
                    { path: "Collages", Component: ColageList },
                    { path: "Sechages", Component: SechageList },
                    { path: "Pliages", Component: PliageList },
                    { path: "Livraisons", Component: LivraisonList },
                    { path: "Receptions", Component: ReceptionList },
                    { path: "Historiques", Component: HistoriqueGlobal },
                    { path: "Statistiques", Component: BuanderieStats },
                    { path: "Reclamations", Component: ReclamationList },
                    { path: "tracking", Component: TrackingPage },
                    { path: "stockage", Component: StockageList },
                    { path: "process", Component: ProcessList },
                    { path: "tri", Component: TriList },
                    { path: "collecte", Component: HistoriqueCollecte },
                    { path: "machines", Component: MachinesDashboard },
                    { path: "bac", Component: BacList },
                    { path: "lot", Component: LotList },
                    { path: "immo", Component: ImmobilisationList },
                    { path: "uniforme", Component: CollageListUniforme },
                    { path: "service", Component: CollageListService },
                    { path: "collecteList", Component: CollecteList },
                    { path: "programme", Component: ProgrammeList },
                    { path: "distUniforme", Component: DistributionUniforme },
                    { path: "distChambre", Component: DistributionChambre },
                    { path: "distribution", Component: DistributionList },
                    { path: "agents", Component: AgentList },
                    { path: "machine", Component: MachineList },
                    { path: "arsenal", Component: ArsenalList },
                    { path: "cycleLavage", Component: CycleLavageList },
                    { path: "chambre", Component: ChambreList },
                    { path: "inventaire", Component: InventaireArsenal },
                    { path: "remise", Component: RemiseLinge },
                    
                ],
            },
        ],
    },
]);
