import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity, BarChart3, Biohazard, Boxes, Check, CheckCircle2, Hourglass, Loader2,
  LogOut, RefreshCw, RotateCcw, ScanLine, WashingMachine,
} from "lucide-react";
import { LavageProvider, useLavage } from "../../../contextes/LavageContext";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import ScanInput from "../../utils/ScanInput";
import { LotBasketCard } from "../../utils/shared/LotBasket";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { DataTable, Code, VueSwitch, useVue, RowActions, RowButton, Badge as KitBadge, Page, QuickStats } from "../../kit";
import { CarteCycle } from "./AtelierParts";
import { EmplacementMachine, Panneau } from "./PosteLavage";
import FinCycleInfecteDialog from "./FinCycleInfecteDialog";
import { CarteBacInfecte, RecapBacInfecte } from "./LavageBacInfecte";
import { chercherBac, cycleContientInfecte, demarrerLavageBacInfecte, estBacInfecte, typeDuBac } from "../../../services/lavageInfecteService";
import { useEtapes } from "../../../hooks/useEtapes";
import { bacsPourLavage } from "../../../services/parcoursService";
import { TONS_ETAT_BAC, libelleEtatBac } from "../../../services/bacTriService";
import MuteButton from "../../utils/MuteButton";
import { useVoiceGuide } from "../../../hooks/useVoiceGuide";
import { getSetting } from "../../../utils/appSettings";
import LotInfoDialog from "../../utils/LotInfoDialog";
import RecapChargement from "../../utils/RecapChargement";
import "../Linge/WorkflowList.css";
import "../Collecte/shared/CollecteRh.css";
import "./Lavage.css";
import "./Atelier.css";
import "./PosteLavage.css";
import "../Reception/Reception.css";
import "./LavageV2.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function LavageInner() {
  const { t } = useTranslation();

  const {
    agent: agentFromContext,
    setAgentDirect,
    etapeBlanc, machine, lotsDisponibles, lotsSelectionnes,
    loadingLots, poidsTotal,
    scannerMachine, chargerLots, scannerLot,
    retirerLot, nouveauCycleBlanc,
    cyclesActifs, chargementCycles, chargerCyclesActifs, terminerCycle, cycleEnFin,
    finirCycle, ajouterCycleLocal,
    produitsUtilises, viderProduits,
  } = useLavage();

  const [cycleAFinir, setCycleAFinir] = useState(null);
  const [bacInfecte, setBacInfecte] = useState(null);

  const { estActive } = useEtapes();
  const sechageActif = estActive("SECHAGE");

  const confirmerFinInfecte = useCallback(async (cycle, codeBac) => {
    try {
      await finirCycle(cycle, codeBac);
    } catch (err) {
      toast.error(t("lavage_infecte.finish_refused"), { description: err.message });
      throw err;
    }
    setCycleAFinir(null);
    toast.success(cycle.infecte
      ? t("lavage_infecte.finish_done", { id: cycle.numeroCycle || cycle.id, bac: codeBac })
      : t("lavage.finish_done_normal", "Bac {{bac}} prêt pour le séchage", { bac: codeBac }));
  }, [finirCycle, t]);

  const [verifFin, setVerifFin] = useState(null);

  const demanderFinCycle = useCallback(async (cycle) => {
    let infecte = Boolean(cycle.infecte);
    if (!infecte && sechageActif) {
      setVerifFin(cycle.id);
      try { infecte = await cycleContientInfecte(cycle.id); } catch { infecte = false; }
      setVerifFin(null);
    }
    if (sechageActif) setCycleAFinir({ ...cycle, infecte });
    else terminerCycle(cycle);
  }, [terminerCycle, sechageActif]);

  const [scanVal, setScanVal] = useState("");
  const [searchLot, setSearchLot] = useState("");
  const location = useLocation();
  const [lotEnAttente, setLotEnAttente] = useState(() => location.state?.codeBac || location.state?.codeLot || null);
  const [lotsAttente, setLotsAttente] = useState([]);
  const [chargementAttente, setChargementAttente] = useState(false);
  const [vueAttente, setVueAttente] = useVue("lavage.attente");
  const [vueLots, setVueLots] = useVue("lavage.lots");

  const chargerAttente = useCallback(async () => {
    setChargementAttente(true);
    try {
      setLotsAttente(await bacsPourLavage());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChargementAttente(false);
    }
  }, []);

  useEffect(() => { if (etapeBlanc === "MACHINE") chargerAttente(); }, [etapeBlanc, chargerAttente]);

  // ✅ Source de vérité unique : l'agent vient du contexte
  const agent = agentFromContext;

  // ─── États pour les infectés ──────────────────────────────────────────────
  const [machineInfecte, setMachineInfecte] = useState(null);
  const [etapeInfecte, setEtapeInfecte] = useState("MACHINE");
  const [modeLavage, setModeLavage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Assistant vocal ──────────────────────────────────────────────────────
  const [voiceLang, setVoiceLang] = useState(() => getSetting("voice.lang"));
  const voice = useVoiceGuide(voiceLang);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => () => voiceRef.current.cancel(), []);

  // Bienvenue une seule fois, dès que l'agent est connu
  const bienvenueFaite = useRef(false);
  useEffect(() => {
    if (!agent || bienvenueFaite.current) return;
    bienvenueFaite.current = true;
    setTimeout(() => voiceRef.current.sayMsg("bienvenue_lavage", "succes", agent.nomPrenom || agent.nom || ""), 600);
  }, [agent]);

  // Linge blanc : démarrage / fin du cycle (déclenchés dans le contexte)
  const etapeBlancPrec = useRef(etapeBlanc);
  useEffect(() => {
    const prec = etapeBlancPrec.current;
    etapeBlancPrec.current = etapeBlanc;
    if (prec === etapeBlanc) return;
    if (etapeBlanc === "EN_COURS") voiceRef.current.sayMsg("lavage_demarre", "succes", lotsSelectionnes.length);
    if (etapeBlanc === "TERMINE") voiceRef.current.sayMsg("lavage_termine", "succes");
  }, [etapeBlanc, lotsSelectionnes.length]);

  const nbCyclesPrec = useRef(cyclesActifs.length);
  useEffect(() => {
    const prec = nbCyclesPrec.current;
    nbCyclesPrec.current = cyclesActifs.length;
    if (cyclesActifs.length > prec && cyclesActifs[0]?.local) {
      voiceRef.current.sayMsg("lavage_demarre", "succes", cyclesActifs[0].lots?.length || 1);
    }
  }, [cyclesActifs]);

  // Linge blanc : lot ajouté / retiré du chargement
  const lotsPrec = useRef(lotsSelectionnes);
  useEffect(() => {
    const prec = lotsPrec.current;
    lotsPrec.current = lotsSelectionnes;
    if (etapeBlanc !== "LOTS") return;
    if (lotsSelectionnes.length === prec.length + 1) {
      const ajoute = lotsSelectionnes[lotsSelectionnes.length - 1].lot;
      const charge = lotsSelectionnes.reduce((s, ls) => s + (ls.lot.poidsActuel || 0), 0);
      voiceRef.current.sayMsg("lot_ajoute", "succes", ajoute.codeLot, Number(charge.toFixed(1)), machine?.capaciteKg);
    } else if (lotsSelectionnes.length === prec.length - 1) {
      const retire = prec.find((ls) => !lotsSelectionnes.some((x) => x.lot.id === ls.lot.id));
      if (retire) voiceRef.current.sayMsg("lot_retire", null, retire.lot.codeLot);
    }
  }, [lotsSelectionnes, etapeBlanc, machine]);

  // ═══════════════════════════════════════════════════════════════════════
  // ✅ Récupérer l'agent depuis localStorage → pousser dans le contexte
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const syncAgent = () => {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        setAgentDirect({
          ...agentData,
          matricule: agentData.matricule || agentData.codeBarre || agentData.login,
          codeBarre: agentData.codeBarre || agentData.matricule || agentData.login,
          nomPrenom: agentData.nomPrenom || agentData.nom || agentData.login || "Inconnu",
        });
      }
    };

    syncAgent();

    const handleFocus = () => syncAgent();
    const handleStorage = (e) => {
      if (e.key === "agent" || e.key === "auth") syncAgent();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setAgentDirect]);

  useEffect(() => {
    if (agent && modeLavage === "NORMAL" && etapeBlanc === "LOTS") chargerLots();
  }, [modeLavage, agent, etapeBlanc, chargerLots]);

  // ✅ Helper pour récupérer le matricule de l'agent (source unique)
  const getAgentMatricule = useCallback(() => {
    return agent?.matricule || agent?.codeBarre || agent?.login || null;
  }, [agent]);

  const scannerMachineUnifie = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/machines/code/${encodeURIComponent(code)}`);
      if (!res.ok) {
        voice.sayMsg("machine_introuvable", "erreur");
        toast.error(t('lavage.machine_not_found'), { description: code });
        return;
      }
      const mach = await res.json();

      if (mach.categorie === "LINGES_INFECTE") {
        setModeLavage("INFECTE");
        setMachineInfecte(mach);
        setEtapeInfecte("BAC");
        setBacInfecte(null);
        voice.sayMsg("machine_infectee", "infecte", mach.code);

        toast.success(t('lavage.infected_machine'), { description: `${mach.code} - ${mach.marque}` });
      } else {
        setModeLavage("NORMAL");
        const machineOk = await scannerMachine(code);
        if (machineOk) voice.sayMsg("machine_normale", "succes", mach.code);
        setEtapeInfecte(null);
        setMachineInfecte(null);

        toast.success(t('lavage.normal_machine'), { description: `${mach.code} - ${mach.marque}` });
      }
    } catch (err) {
      voice.sayErreurGenerique(err.message);
      toast.error(t('common.error'), { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [scannerMachine, t, voice]);

  const scannerBacInfecte = useCallback(async (code) => {
    if (!machineInfecte) {
      voice.sayMsg("scanner_machine_d_abord", "alerte");
      toast.warning(t('lavage.scan_machine_first'), { description: t('lavage.scan_machine_first_text') });
      return;
    }
    if (bacInfecte) {
      toast.warning(t('lavage.cycle_in_progress'), { description: bacInfecte.code });
      return;
    }
    let bac;
    try { bac = await chercherBac(code); } catch (err) { toast.error(t('common.error'), { description: err.message }); return; }
    if (!bac) {
      toast.error(t('lavage_infecte.error_title'), { description: t('lavage_infecte.bac_not_found', { code }) });
      return;
    }
    if (!estBacInfecte(bac)) {
      toast.error(t('lavage_infecte.error_title'), { description: t('lavage_infecte.bac_not_infected', { code: bac.code || code, type: typeDuBac(bac) || "—" }) });
      return;
    }
    setBacInfecte({ ...bac, code: bac.code || bac.codeBac || code });
    toast.success(t('lavage_infecte.source_BAC_INFECTE'), { description: bac.code || bac.codeBac || code });
  }, [machineInfecte, bacInfecte, t, voice]);

  const demarrerBacInfecte = useCallback(async (poidsCharge) => {
    const matricule = getAgentMatricule();
    if (!matricule) throw new Error("Agent non identifié. Veuillez vous reconnecter.");
    const c = await demarrerLavageBacInfecte({
      codeMachine: machineInfecte.code,
      codeBac: bacInfecte.code,
      matriculeAgent: matricule,
      poidsCharge,
      produitIds: produitsUtilises.map((p) => p.id),
    });
    viderProduits();
    ajouterCycleLocal(c, {
      machine: machineInfecte,
      infecte: true,
      bac: bacInfecte.code,
      programme: c?.programmeLavage?.nom || t("lavage_infecte.programme_value"),
      temperature: c?.programmeLavage?.temperatureCelsius ?? null,
      vitesse: c?.programmeLavage?.vitesseEssorageRpm ?? null,
      dureePrevue: c?.programmeLavage?.dureeMinutes ?? null,
      lots: [],
    });
    chargerCyclesActifs();
    toast.success(t("lavage_infecte.started", { id: c?.numeroCycle || c?.id, machine: machineInfecte.code }));
    setBacInfecte(null);
    setMachineInfecte(null);
    setEtapeInfecte("MACHINE");
    setModeLavage(null);
    setScanVal("");
  }, [getAgentMatricule, machineInfecte, bacInfecte, ajouterCycleLocal, chargerCyclesActifs, t, produitsUtilises, viderProduits]);

  const nouveauCycleInfecte = useCallback(() => {
    viderProduits();
    setMachineInfecte(null);
    setBacInfecte(null);
    setEtapeInfecte("MACHINE");
    setModeLavage(null);
    setScanVal("");
  }, [viderProduits]);

  // ─── Scan général ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    setScanVal("");
    if (!agent) return;
    if (!code?.trim()) return;

    if (!modeLavage) {
      await scannerMachineUnifie(code);
      return;
    }

    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeBlanc === "LOTS") {
        const c = code.trim();
        const lotTrouve = lotsDisponibles.find(l => l.codeLot === c);
        if (lotsSelectionnes.some(ls => ls.lot.codeLot === c)) voice.sayMsg("lot_deja_ajoute", "alerte", c);
        else if (lotTrouve && machine && poidsTotal + (lotTrouve.poidsActuel || 0) > machine.capaciteKg) voice.sayMsg("capacite_depassee", "alerte", machine.capaciteKg);
        await scannerLot(code, poidsTotal);
        return;
      }
    }

    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") {
        await scannerMachineUnifie(code);
        return;
      }
      if (etapeInfecte === "BAC") {
        await scannerBacInfecte(code);
        return;
      }
    }
  }, [agent, modeLavage, etapeBlanc, etapeInfecte, scannerMachineUnifie, scannerLot, scannerBacInfecte, poidsTotal, lotsDisponibles, lotsSelectionnes, machine, voice]);

  useEffect(() => {
    if (!lotEnAttente || modeLavage !== "NORMAL" || etapeBlanc !== "LOTS") return;
    const code = lotEnAttente;
    setLotEnAttente(null);
    scannerLot(code, poidsTotal);
  }, [lotEnAttente, modeLavage, etapeBlanc, lotsDisponibles, scannerLot, poidsTotal]);

  const lancerDepuisAttente = (lot) => {
    setLotEnAttente(lot.codeLot);
    if (modeLavage === "NORMAL" && etapeBlanc === "LOTS") return;
    toast.info(t("lavage.scan_machine_for_bac", "Scannez la machine pour laver le bac {{code}}", { code: lot.codeLot }));
  };

  const colonnesLots = (onAction, actionLabel, ActionIcon) => ({
    codeLot: { label: t("tri.bac", "Bac"), render: (l) => <Code>{l.codeLot}</Code> },
    categorie: { label: t("tri.category", "Catégorie"), render: (l) => t(`categories.${l.categorie}`, l.categorie || "—") },
    typeCollecte: { label: t("tri.type", "Type"), render: (l) => l.typeCollecte || "—" },
    etat: {
      label: t("lot.status", "État"),
      render: (l) => <KitBadge variant={TONS_ETAT_BAC[l.etat] || "success"}>{libelleEtatBac(t, l.etat || "PRET_LAVAGE")}</KitBadge>,
    },
    nb: { label: t("chargement.linens", "Linges"), render: (l) => l.nbPieces ?? "—" },
    balance: { label: t("chargement.scale", "Balance"), render: (l) => (l.poidsBalance != null ? `${Number(l.poidsBalance).toFixed(2)} kg` : "—") },
    declare: { label: t("chargement.declared_weight", "Poids déclaré"), render: (l) => `${Number(l.poidsDeclare ?? l.poidsActuel ?? 0).toFixed(2)} kg` },
    action: {
      label: t("cycles.actions", "Actions"),
      render: (l) => (
        <RowActions>
          <RowButton icon={ActionIcon} title={actionLabel(l)} onClick={() => onAction(l)} />
        </RowActions>
      ),
    },
  });

  const lotsFiltres = useMemo(() => {
    const ids = new Set(lotsSelectionnes.map(ls => ls.lot.id));
    return lotsDisponibles.filter(l =>
      !ids.has(l.id) &&
      (!searchLot ||
        l.codeLot.toLowerCase().includes(searchLot.toLowerCase()) ||
        l.categorie?.toLowerCase().includes(searchLot.toLowerCase()))
    );
  }, [lotsDisponibles, lotsSelectionnes, searchLot]);

  const getPlaceholder = () => {
    if (!agent) return t('lavage.agent_not_connected');
    if (!modeLavage) return t('lavage.scan_machine_code');

    if (modeLavage === "NORMAL") {
      if (etapeBlanc === "MACHINE") return t('lavage.scan_machine_code');
      if (etapeBlanc === "LOTS") return t('lavage.scan_lot');
    }

    if (modeLavage === "INFECTE") {
      if (etapeInfecte === "MACHINE") return t('lavage.scan_machine_code');
      if (etapeInfecte === "BAC") return t('lavage_infecte.scan_bac');
    }
    return t('lavage.scan');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    if (modeLavage === "INFECTE") return "#dc2626";
    return "#0794a4";
  };

  const getModeLabel = () => {
    if (!modeLavage) return t('lavage.waiting');
    if (modeLavage === "NORMAL") return t('lavage.normal_linen');
    return t('lavage.infected_linen');
  };

  const infecte = modeLavage === "INFECTE";
  const machineActive = infecte ? machineInfecte : modeLavage === "NORMAL" ? machine : null;
  const changerMachine = () => {
    nouveauCycleBlanc();
    nouveauCycleInfecte();
  };

  const detailMachine = machineActive
    ? [infecte ? t("lavage.infected_linen") : t("lavage.normal_linen"), machineActive.capaciteKg && `${machineActive.capaciteKg} kg`, machineActive.marque].filter(Boolean).join(" · ")
    : null;

  const etapeCourante = infecte ? etapeInfecte : modeLavage === "NORMAL" ? etapeBlanc : "MACHINE";

  const [showStats, setShowStats] = useState(false);

  const toutActualiser = () => {
    chargerCyclesActifs();
    if (!modeLavage || (modeLavage === "NORMAL" && etapeBlanc === "MACHINE")) chargerAttente();
    if (modeLavage === "NORMAL" && etapeBlanc === "LOTS") chargerLots();
  };
  const actualisation = chargementCycles || chargementAttente || loadingLots;

  const cycleTermine = !infecte && modeLavage === "NORMAL" && etapeBlanc === "TERMINE";

  const tone = infecte ? "danger" : "teal";

  const stats = useMemo(() => {
    const poids = lotsAttente.reduce((s, l) => s + Number(l.poidsBalance ?? l.poidsDeclare ?? l.poidsActuel ?? 0), 0);
    const linges = lotsAttente.reduce((s, l) => s + Number(l.nbPieces ?? 0), 0);
    const parCategorie = lotsAttente.reduce((acc, l) => {
      const k = t(`categories.${l.categorie}`, l.categorie || "—");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const parProgramme = cyclesActifs.reduce((acc, c) => {
      const k = c.programme && c.programme !== "—" ? c.programme : t("lavage.no_program", "Sans programme");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const infectes = cyclesActifs.filter((c) => c.infecte).length;
    return { poids, linges, parCategorie, parProgramme, infectes };
  }, [lotsAttente, cyclesActifs, t]);

  const nomAgent = agent ? String(agent.nomPrenom || agent.nom || agent.login || agent.matricule || "").trim() : "";
  const initialesAgent = nomAgent.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";

  const etapeFaite = [
    Boolean(agent),
    Boolean(machineActive),
    infecte ? Boolean(bacInfecte) : etapeBlanc === "EN_COURS" || etapeBlanc === "TERMINE",
    !infecte && etapeBlanc === "TERMINE",
  ];
  const etapeActive = etapeFaite.findIndex((f) => !f);
  const etapes = [
    t("lavage.step_identify", "Identification de l'agent"),
    t("lavage.step_machine", "Machine"),
    t("lavage.step_load", "Chargement"),
    t("lavage.step_wash", "Lavage"),
  ];

  return (
    <Page className={`cr-page lv-page at-page lw-page rc lw-v2 ${infecte ? "is-infecte" : ""}`}>
      <LotInfoDialog />

      <div className="rc-toolbar">
        <div className="rc-head__right">
          {agent && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initialesAgent}</span>
              <span className="rc-agent__text">
                <span className="rc-agent__name">{nomAgent || "—"}</span>
                <span className="rc-agent__id">{agent.matricule || agent.codeBarre}</span>
              </span>
            </div>
          )}
          <MuteButton
            muted={voice.muted}
            onToggle={voice.toggleMute}
            speaking={voice.speaking}
            lang={voiceLang}
            onLangChange={setVoiceLang}
          />
          <button type="button" className="rc-btn" disabled={!agent} onClick={toutActualiser}>
            <RefreshCw size={15} className={actualisation ? "animate-spin" : ""} /> {t("common.refresh", "Actualiser")}
          </button>
          {cycleTermine ? (
            <button type="button" className="rc-btn rc-btn--primary" onClick={nouveauCycleBlanc}>
              <RotateCcw size={14} /> {t("lavage.new_cycle")}
            </button>
          ) : (
            <button type="button" className="rc-btn" disabled={!machineActive} onClick={changerMachine}>
              <LogOut size={14} /> {t("lavage.change_machine", "Changer de machine")}
            </button>
          )}
          <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
            <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
          </button>
        </div>
      </div>

      <ol className="rc-steps rc-steps--4" aria-label={t("lavage.steps", "Étapes du lavage")}>
        {etapes.map((label, i) => (
          <li key={label} className={`rc-step ${etapeFaite[i] ? "is-done" : ""} ${etapeActive === i ? "is-active" : ""}`}>
            <span className="rc-step__num">{etapeFaite[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="rc-step__label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="lw-stack">
        <section className={`rc-card rc-scan ${infecte || !agent ? "is-infecte" : ""}`}>
          <header className="rc-scan__bar">
            <span className="rc-scan__title"><ScanLine size={17} /> {t("lavage.title")}</span>
            {modeLavage && <span className="rc-mode"><i /> {getModeLabel()}</span>}
          </header>
          <div className="rc-scan__body lv2-scan">
            <div className={`rc-scan__field ${infecte || !agent ? "is-infecte" : ""}`}>
              <ScanInput
                placeholder=""
                value={scanVal}
                onChange={setScanVal}
                onSubmit={handleScan}
                borderColor={getBorderColor()}
                keepFocus={true}
                autoDebounce={true}
                disabled={!agent || isLoading}
              />
            </div>
            <EmplacementMachine
              machine={machineActive}
              icon={infecte ? <Biohazard size={20} /> : <WashingMachine size={20} />}
              detail={detailMachine}
              enCours={Boolean(machineActive) && cyclesActifs.some((c) => c.machine?.code === machineActive.code)}
              tone={tone}
              videTitre={t("lavage.no_machine", "Aucune machine")}
              charge={!infecte && modeLavage === "NORMAL" && etapeBlanc !== "MACHINE" ? { poids: poidsTotal } : null}
              onChanger={machineActive ? changerMachine : null}
            />
          </div>
        </section>

        {agent && cyclesActifs.length > 0 && (
          <Panneau
            id="lw-cycles-titre"
            tone="live"
            icon={<Activity size={18} />}
            titre={t("lavage.active_cycles", "Lavages en cours")}
            compte={cyclesActifs.length}
          >
            <div className="at-cycles">
              {cyclesActifs.map((c) => (
                <CarteCycle
                  key={c.id}
                  cycle={c}
                  infecte={Boolean(c.infecte)}
                  onTerminer={() => demanderFinCycle(c)}
                  busy={cycleEnFin === c.id || verifFin === c.id || cycleAFinir?.id === c.id}
                  libelleFin={t("atelier.finish", "Terminer")}
                />
              ))}
            </div>
          </Panneau>
        )}

        {agent && (!modeLavage || (modeLavage === "NORMAL" && etapeBlanc === "MACHINE")) && (
          <Panneau
            id="lw-attente-titre"
            icon={<Hourglass size={18} />}
            titre={t("lavage.waiting_bacs", "Bacs en attente de lavage")}
            compte={lotsAttente.length}
            outils={<VueSwitch value={vueAttente} onChange={setVueAttente} compact />}
          >
            {lotsAttente.length === 0 ? (
              <div className="lw-empty">
                <span className="lw-empty__icon">{chargementAttente ? <Loader2 size={20} className="animate-spin" /> : <Boxes size={20} />}</span>
                <span>{chargementAttente ? t("common.loading") : t("lavage.no_waiting_bacs", "Aucun bac en attente de lavage.")}</span>
              </div>
            ) : vueAttente === "tableau" ? (
              <DataTable
                columns={colonnesLots(lancerDepuisAttente, () => t("chargement.start_wash", "Lancer le lavage"), WashingMachine)}
                rows={lotsAttente}
                rowKey={(l) => l.codeLot}
                activeId={lotEnAttente}
              />
            ) : (
              <div className="lv-grid">
                {lotsAttente.map((lot) => (
                  <div key={lot.codeLot} className={`lv-attente__item ${lotEnAttente === lot.codeLot ? "is-pending" : ""}`}>
                    <LotBasketCard lot={lot} t={t} sansCapacite selected={lotEnAttente === lot.codeLot} onSelect={lancerDepuisAttente} />
                    <button type="button" className="at-btn-ghost at-btn-ghost--block" onClick={() => lancerDepuisAttente(lot)}>
                      <WashingMachine size={14} /> {t("chargement.start_wash", "Lancer le lavage")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panneau>
        )}

        {agent && modeLavage === "NORMAL" && etapeBlanc !== "MACHINE" && (
          <div className="lw-work">
            <div className="lw-stack">
              {etapeBlanc === "TERMINE" && (
                <section className="lw-done" role="status">
                  <span className="lw-done__icon"><CheckCircle2 size={26} /></span>
                  <div>
                    <h3>{t("lavage.wash_completed")}</h3>
                    <p>{lotsSelectionnes.length} {t("lavage.bacs_washed_success", "bac(s) lavé(s) avec succès")}</p>
                  </div>
                  <button type="button" className="lv-btn lv-btn--primary" onClick={nouveauCycleBlanc}>
                    <RotateCcw size={16} /> {t("lavage.new_cycle")}
                  </button>
                </section>
              )}

              {(etapeBlanc === "LOTS" || etapeBlanc === "EN_COURS") && (
                <Panneau
                  id="lw-lots-titre"
                  icon={<Boxes size={18} />}
                  titre={t("lavage.ready_bacs", "Bacs prêts pour le lavage")}
                  compte={lotsFiltres.length}
                  outils={(
                    <>
                      <input
                        type="search"
                        className="lw-search"
                        placeholder={t("common.search")}
                        aria-label={t("lavage.search_bac", "Rechercher un bac")}
                        value={searchLot}
                        onChange={(e) => setSearchLot(e.target.value)}
                        onFocus={(e) => e.stopPropagation()}
                      />
                      <VueSwitch value={vueLots} onChange={setVueLots} compact />
                    </>
                  )}
                >
                  {loadingLots ? (
                    <div className="lw-empty"><span className="lw-empty__icon"><Loader2 size={20} className="animate-spin" /></span><span>{t("common.loading")}</span></div>
                  ) : lotsFiltres.length === 0 ? (
                    <div className="lw-empty"><span className="lw-empty__icon"><Boxes size={20} /></span><span>{t("lavage.no_bacs_available", "Aucun bac prêt. Scannez un bac validé pour l'ajouter.")}</span></div>
                  ) : vueLots === "tableau" ? (
                    <DataTable
                      columns={colonnesLots((l) => scannerLot(l.codeLot, poidsTotal), () => t("lavage.add_lot", "Ajouter au chargement"), WashingMachine)}
                      rows={lotsFiltres}
                      rowKey={(l) => l.codeLot}
                    />
                  ) : (
                    <div className="lv-grid">
                      {lotsFiltres.map((lot) => (
                        <LotBasketCard
                          key={lot.id}
                          lot={lot}
                          t={t}
                          sansCapacite
                          selected={!!lotsSelectionnes.find((ls) => ls.lot.id === lot.id)}
                          onSelect={(l) => {
                            const dejaSelectionne = !!lotsSelectionnes.find((ls) => ls.lot.id === l.id);
                            if (dejaSelectionne) retirerLot(l.codeLot);
                            else scannerLot(l.codeLot, poidsTotal);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Panneau>
              )}
            </div>
            <RecapChargement />
          </div>
        )}

        {agent && infecte && etapeInfecte !== "MACHINE" && (
          <div className="lw-work">
            <Panneau
              id="lw-infecte-titre"
              tone="danger"
              icon={<Biohazard size={18} />}
              titre={t("lavage_infecte.title")}
            >
              {bacInfecte ? (
                <CarteBacInfecte bac={bacInfecte} />
              ) : (
                <div className="lw-empty">
                  <span className="lw-empty__icon"><ScanLine size={20} /></span>
                  <strong>{t("lavage_infecte.scan_bac")}</strong>
                </div>
              )}
            </Panneau>
            {bacInfecte && (
              <RecapBacInfecte
                key={bacInfecte.code}
                bac={bacInfecte}
                machine={machineInfecte}
                onRetirer={() => setBacInfecte(null)}
                onDemarrer={demarrerBacInfecte}
              />
            )}
          </div>
        )}
      </div>

      <FinCycleInfecteDialog
        key={cycleAFinir?.id ?? "aucun"}
        cycle={cycleAFinir}
        onConfirm={confirmerFinInfecte}
        onClose={() => setCycleAFinir(null)}
      />

      {showStats && (
        <QuickStats
          title={t("lavage.title")}
          subtitle={t("lavage.stats_subtitle", "Situation instantanée du poste de lavage")}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t("lavage.active_cycles", "Lavages en cours"), value: cyclesActifs.length },
            { label: t("lavage.kpi_infected_cycles", "Cycles infectés"), value: stats.infectes, color: "#ef4444" },
            { label: t("lavage.waiting_bacs", "Bacs en attente de lavage"), value: lotsAttente.length, color: "#f59e0b" },
            { label: t("lavage.kpi_waiting_weight", "Poids en attente"), value: `${stats.poids.toFixed(1)} kg`, color: "#6366f1" },
            { label: t("lavage.kpi_waiting_linen", "Linges en attente"), value: stats.linges, color: "#10b981" },
          ]}
          repartitions={[{
            title: t("tri.category", "Catégorie"),
            items: Object.entries(stats.parCategorie).map(([label, value]) => ({ label, value })),
          }]}
          classements={[{
            title: t("lavage.program", "Programme"),
            items: Object.entries(stats.parProgramme).map(([label, value]) => ({ label, value })),
          }]}
        />
      )}
    </Page>
  );
}

export default function LavageList() {
  return (
    <LavageProvider>
      <LavageInner />
    </LavageProvider>
  );
}
