import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../../contextes/LingeContext";
import { useModal } from "../../../contextes/ModalContext";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Boxes, CheckCircle, ClipboardCheck, ClipboardList, History, LogOut, RotateCcw,
  Check, Loader2, ScanLine, UserCheck,
} from "lucide-react";
import { DataTable, Code, Badge, VueSwitch, useVue, RowActions, RowButton, Modal, QuickStats } from "../../kit";
import ValiderLotModal from "../../utils/shared/ValiderLotModal";
import { STATS_INITIALES, MODE_RFID, MODE_CODEBARRE } from "../../../constants/tri";
import { LotBasketCard, LotBasketSvg } from "../../utils/shared/LotBasket";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { SortGlyph } from "./TriArt";
import "../Reception/Reception.css";
import "./Tri.css";
import { TriProvider, useTri } from "../../../contextes/TriContext";
import ScanInput from "../../utils/shared/ScanInput";
import GroupeLavageBadge from "../../utils/shared/GroupeLavageBadge";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import { suggererBacs, trierDansBac, versBacTri, libelleEtatBac } from "../../../services/bacTriService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function TriInner() {
  const { t } = useTranslation();

  const { getLingeByCode, isRfidMode } = useContext(LingeContext);
  const { showAlert, showConfirm } = useModal();

  const [scanValue,     setScanValue]     = useState("");
  const [isLoading,     setIsLoading]     = useState(false);
  const [agentScanne,   setAgentScanne]   = useState(null);
  const [lingeScanne,   setLingeScanne]   = useState(null);
  const [lotSuggere,    setLotSuggere]    = useState(null);
  const [historiqueTri, setHistoriqueTri] = useState([]);
  const [statistiques,  setStatistiques]  = useState(STATS_INITIALES);
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const modeScan = isRfidMode ? MODE_RFID : MODE_CODEBARRE;
  const [lotsSuggere,   setLotsSuggere]   = useState([]);
  const [showDialog,    setShowDialog]    = useState(false);
  const [lingeEnCours,  setLingeEnCours]  = useState(null);
  const [lotAValider,   setLotAValider]   = useState(null);
  const [scanBac,       setScanBac]       = useState("");
  const [etatsLots,     setEtatsLots]     = useState({});
  const [vueHistorique, setVueHistorique] = useVue("tri.historique");
  const [vueChoix,      setVueChoix]      = useVue("tri.choix");
  const [showStats,     setShowStats]     = useState(false);

  const scanInputRef    = useRef(null);
  const isMounted       = useRef(true);
  const resetTimeoutRef = useRef(null);
  const scanTimeoutRef  = useRef(null);

  // ✅ Récupérer l'agent depuis localStorage
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule || '',
        nom: agentData.nom || 'Inconnu',
        prenom: agentData.prenom || '',
        nomPrenom: agentData.nomPrenom || agentData.nom || 'Inconnu',
        codeBarre: agentData.codeBarre || agentData.matricule || '',
        id: agentData.id || null,
        poste: agentData.poste || 'AGENT_TRI'
      };
      setAgentScanne(ag);
      chargerStatistiques(ag.matricule);
    }
  }, []);

  const chargerStatistiques = useCallback(async (matricule) => {
    try {
      const res = await fetch(
        `${API_URL}/api/tri/statistiques?matricule=${matricule}`
      );
      if (res.ok && isMounted.current) {
        setStatistiques(await res.json());
      }
    } catch (err) {
      console.error("Erreur statistiques:", err);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(resetTimeoutRef.current);
      clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current && scanInputRef.current) {
        scanInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const focusInput = useCallback((delay = 200) => {
    setTimeout(() => {
      if (isMounted.current && scanInputRef.current) {
        scanInputRef.current.focus();
      }
    }, delay);
  }, []);

  const resetAllStates = useCallback((keepFocus = true) => {
    clearTimeout(resetTimeoutRef.current);
    clearTimeout(scanTimeoutRef.current);
    setScanValue("");
    setAgentScanne(null);
    setLingeScanne(null);
    setLotSuggere(null);
    setLotsSuggere([]);
    setHistoriqueTri([]);
    setStatistiques(STATS_INITIALES);
    setIsLoading(false);
    setShowDialog(false);
    setLingeEnCours(null);
    if (keepFocus) focusInput(150);
  }, [focusInput]);

  useEffect(() => {
    clearTimeout(scanTimeoutRef.current);
    if (scanValue.trim().length <= 2 || isLoading) return;

    scanTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      if (!agentScanne) {
        handleScanAgent();
      } else {
        handleScanLinge();
      }
    }, 400);

    return () => clearTimeout(scanTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanValue]);

  const getAgentFullName = () => {
    if (!agentScanne) return '';
    return agentScanne.nomPrenom || agentScanne.nom || agentScanne.matricule;
  };

  const handleScanAgent = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanValue("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const agent = await res.json();
        const agentWithName = {
          ...agent,
          nomPrenom: agent.nomPrenom || agent.nom || agent.matricule
        };
        setAgentScanne(agentWithName);
        await chargerStatistiques(agentWithName.matricule);
        showAlert(
          t('tri.agent_identified'),
          `✅ ${agentWithName.nomPrenom} (${agentWithName.matricule})`,
          "success"
        );
      } else {
        showAlert(
          t('tri.agent_not_found'),
          t('tri.agent_not_found_text', { code: code }),
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showAlert(t('tri.technical_error'), t('tri.technical_error_text'), "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, showAlert, focusInput, chargerStatistiques, t]);

  const fetchLotsSuggere = useCallback(async (code) => {
    try {
      return (await suggererBacs(code)).map(versBacTri);
    } catch (err) {
      showAlert(t('tri.tri_error'), err.message, "error");
      return null;
    }
  }, [showAlert, t]);

  const affecterAuLot = useCallback(async (codeBac) => {
    if (!lingeEnCours || !agentScanne || !codeBac) return;

    setIsLoading(true);
    try {
      const codeOuTag = lingeEnCours.codeSuivi || lingeEnCours.codeBarre || lingeEnCours.rfidTag;
      const lot = versBacTri(await trierDansBac(codeOuTag, String(codeBac).trim(), agentScanne.matricule));
      setEtatsLots((prev) => ({ ...prev, [lot.codeBac]: { etatBac: lot.etat, poidsBalance: lot.poidsBalance } }));
      setLotSuggere(lot);
      setShowDialog(false);
      setLingeEnCours(null);
      setLotsSuggere([]);

      setHistoriqueTri(prev => [{
        codeLinge: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
        categorie: lingeEnCours.categorie,
        groupeLavage: lingeEnCours.groupeLavage,
        typeCollecte: lingeEnCours.typeCollecte,
        lotCode: lot.codeBac,
        date: new Date().toLocaleTimeString(),
        poids: lingeEnCours.poids
      }, ...prev]);

      setStatistiques(prev => ({
        ...prev,
        totalTrie: prev.totalTrie + 1,
        poidsTotal: prev.poidsTotal + (lingeEnCours.poids || 0)
      }));

      showAlert(
        t('tri.tri_success'),
        t('tri.tri_success_weight', {
          code: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
          lotCode: lot.codeBac,
          poids: Number(lot.poidsDeclare || 0).toFixed(2),
          categorie: lot.categorie,
          typeCollecte: lot.typeCollecte
        }),
        "success"
      );

      setTimeout(() => { if (isMounted.current) setLingeScanne(null); }, 2000);

    } catch (err) {
      console.error("Erreur affectation:", err);
      showAlert(t('tri.tri_error'), err.message, "error");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [lingeEnCours, agentScanne, showAlert, focusInput, t]);

  const handleScanLinge = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;

    setScanValue("");
    setIsLoading(true);
    try {
      const linge = await getLingeByCode(code);
      if (!linge) {
        showAlert(t('tri.linge_not_found'), t('tri.linge_not_found_text', { code: code }), "error");
        return;
      }

      if (linge.etat !== "RECEPTION") {
        showAlert(
          t('tri.invalid_state'),
          t('tri.invalid_state_text', { code: code, etat: linge.etat }),
          "warning"
        );
        return;
      }

      setLingeScanne(linge);
      setLingeEnCours(linge);

      const lots = await fetchLotsSuggere(code);
      if (!lots) {
        setLingeScanne(null);
        setLingeEnCours(null);
        return;
      }

      if (lots.length === 0) {
        showAlert(
          t('tri.no_lot_available_title'),
          t('tri.no_lot_available_message', {
            typeCollecte: linge.typeCollecte
          }),
          "warning"
        );
        setLingeScanne(null);
        setLingeEnCours(null);
        return;
      }

      setLotsSuggere(lots);
      setShowDialog(true);

    } catch (err) {
      console.error("Erreur scan:", err);
      showAlert(t('tri.tri_error'), err.message, "error");
      setLingeScanne(null);
      setLingeEnCours(null);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        focusInput();
      }
    }
  }, [scanValue, getLingeByCode, fetchLotsSuggere, showAlert, focusInput, t]);

  const handleLogoutAgent = useCallback(() => {
    showConfirm(t('tri.confirm_logout'), t('tri.confirm_logout_text'), "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert(t('tri.logout_success'), "✅ Agent déconnecté", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates, t]);

  const handleResetAll = useCallback(() => {
    showConfirm(t('tri.confirm_reset'), t('tri.confirm_reset_text'), "warning")
      .then(ok => {
        if (ok && isMounted.current) {
          resetAllStates(true);
          showAlert(t('tri.reset_success'), "✅ Tout a été réinitialisé", "info");
        }
      });
  }, [showConfirm, showAlert, resetAllStates, t]);

  const fermerDialogue = () => {
    setShowDialog(false);
    setLotsSuggere([]);
    setLingeEnCours(null);
    setLingeScanne(null);
    focusInput();
  };

  const getPlaceholder = () => {
    if (!agentScanne) return t('tri.scan_placeholder_no_agent');
    return modeScan === MODE_RFID ? t('tri.scan_placeholder_rfid') : t('tri.scan_placeholder');
  };

  const getBorderColor = () => {
    if (!agentScanne) return "#e03131";
    return "#0d9488";
  };

  // ─── Rendu ────────────────────────────────────────────────────────────
  const nomAgent = getAgentFullName();
  const libelleCategorie = (cat) => (cat ? t(`categories.${cat}`, cat) : t("reception.non_categorise"));

  // Répartition des articles triés pendant la session
  const parCategorie = historiqueTri.reduce((acc, h) => {
    const cat = h.categorie || "AUTRE";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Lots alimentés pendant la session (le plus récent en premier)
  const lotsSession = Object.values(
    historiqueTri.reduce((acc, h) => {
      if (!acc[h.lotCode]) acc[h.lotCode] = { code: h.lotCode, n: 0, poids: 0, categorie: h.categorie, typeCollecte: h.typeCollecte };
      acc[h.lotCode].n += 1;
      acc[h.lotCode].poids += Number(h.poids) || 0;
      return acc;
    }, {})
  );

  const lotPoids = Number(lotSuggere?.poidsDeclare) || 0;
  const etatLot = (code, defaut) => etatsLots[code]?.etatBac || defaut || "EN_TRI";
  const balanceLot = (code, defaut) => etatsLots[code]?.poidsBalance ?? defaut ?? null;
  const ouvrirValidation = (lot) => setLotAValider({
    codeBac: lot.codeBac || lot.codeLot || lot.code,
    poidsDeclare: lot.poidsDeclare ?? lot.poids,
    poidsBalance: balanceLot(lot.codeBac || lot.codeLot || lot.code, lot.poidsBalance),
    nbLinges: lot.nbLinges ?? lot.n,
  });
  const lotValide = (dto) => {
    if (dto?.codeBac) setEtatsLots((prev) => ({ ...prev, [dto.codeBac]: dto }));
    setLotAValider(null);
    focusInput();
  };

  const lingeCourant = lingeEnCours || lingeScanne;

  const lotEnTri = lotSuggere && etatLot(lotSuggere.codeBac, lotSuggere.etat) === "EN_TRI";

  const etapeFaite = [Boolean(agentScanne), Boolean(lingeCourant || lotSuggere), Boolean(lotSuggere)];
  const etapeActive = etapeFaite.findIndex((f) => !f);
  const etapes = [
    t("tri.step_identify", "Identification de l'agent"),
    t("tri.step_scan", "Scan du linge"),
    t("tri.step_assign", "Affectation au bac"),
  ];

  return (
    <div className="collecte-container rc tr">
      {lotAValider && (
        <ValiderLotModal
          lot={lotAValider}
          matriculeAgent={agentScanne?.matricule}
          onClose={() => { setLotAValider(null); focusInput(); }}
          onValide={lotValide}
        />
      )}

      {showDialog && lotsSuggere.length > 0 && (
        <Modal
          size={lotsSuggere.length > 2 ? "lg" : "md"}
          icon={<CategoryTile categorie={lingeEnCours?.categorie} size={36} />}
          title={t('tri.choose_lot')}
          subtitle={[lingeEnCours?.codeSuivi || lingeEnCours?.codeBarre, lingeEnCours?.designation].filter(Boolean).join(" · ")}
          headerActions={<><GroupeLavageBadge groupe={lingeEnCours?.groupeLavage} /> <TypeCollecte type={lingeEnCours?.typeCollecte} /></>}
          onClose={fermerDialogue}
          closeOnOverlay={false}
          className="tr-choix"
        >
          <div className="tr-modal__body" data-modal="true">
            <div className="tr-modal__hint" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <SortGlyph size={20} /> {t('tri.choose_lot_hint', { count: lotsSuggere.length })}
              </span>
              <VueSwitch value={vueChoix} onChange={setVueChoix} compact />
            </div>
            <div className="tr-modal__scan">
              <ScanInput
                placeholder={t('tri.scan_bac', 'Scannez le bac de destination')}
                value={scanBac}
                onChange={setScanBac}
                onSubmit={(c) => { setScanBac(""); affecterAuLot(c); }}
                borderColor="#0d9488"
                autoDebounce
                disabled={isLoading}
              />
            </div>
            {vueChoix === "tableau" ? (
              <DataTable
                columns={{
                  codeLot: { label: t('tri.bac', 'Bac'), render: (l) => <Code>{l.codeBac}</Code> },
                  etat: { label: t('tri.status'), render: (l) => libelleEtatBac(t, l.etat) },
                  groupeLavage: { label: t('groupe_lavage.label', 'Groupe'), render: (l) => <GroupeLavageBadge groupe={l.groupeLavage} libre={l.etat === "VIDE" || !l.groupeLavage} /> },
                  typeCollecte: { label: t('tri.type'), render: (l) => <TypeCollecte type={l.typeCollecte} /> },
                  nb: { label: t('chargement.linens', 'Linges'), render: (l) => l.nbPieces ?? l.quantite ?? "—" },
                  poids: { label: t('chargement.declared_weight', 'Poids déclaré'), render: (l) => `${Number(l.poidsDeclare || 0).toFixed(2)} kg` },
                  balance: { label: t('chargement.scale', 'Balance'), render: (l) => (l.poidsBalance != null ? `${Number(l.poidsBalance).toFixed(2)} kg` : "—") },
                  action: {
                    label: t('cycles.actions', 'Actions'),
                    render: (l) => (
                      <RowActions>
                        <RowButton icon={CheckCircle} title={t('tri.choose_lot')} onClick={() => affecterAuLot(l.codeBac)} />
                      </RowActions>
                    ),
                  },
                }}
                rows={lotsSuggere}
                rowKey={(l) => l.codeBac}
                onRowDoubleClick={(l) => affecterAuLot(l.codeBac)}
              />
            ) : (
              <div className="lot-basket-grid">
                {lotsSuggere.map((lot, index) => (
                  <LotBasketCard key={lot.codeBac || index} lot={lot} t={t} sansCapacite onSelect={() => affecterAuLot(lot.codeBac)} />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      <div className="rc-toolbar">
        <div className="rc-head__right">
            {agentScanne && (
              <div className="rc-agent">
                <span className="rc-agent__avatar">{initialesTri(nomAgent)}</span>
                <span className="rc-agent__text">
                  <span className="rc-agent__name">{nomAgent}</span>
                  <span className="rc-agent__id">{agentScanne.codeBarre || agentScanne.matricule}</span>
                </span>
                <button type="button" className="rc-agent__out" onClick={handleLogoutAgent} title={t('tri.confirm_logout')} aria-label={t('tri.confirm_logout')}>
                  <LogOut size={14} />
                </button>
              </div>
            )}
            <button type="button" className="rc-btn" onClick={() => setShowStats(true)}>
              <BarChart3 size={15} /> {t("common.statistics", "Statistiques")}
            </button>
            <button type="button" className="rc-btn" onClick={handleResetAll}>
              <RotateCcw size={14} /> {t('tri.reset')}
            </button>
        </div>
      </div>

      <ol className="rc-steps" aria-label={t("tri.steps", "Étapes du tri")}>
        {etapes.map((label, i) => (
          <li key={label} className={`rc-step ${etapeFaite[i] ? "is-done" : ""} ${etapeActive === i ? "is-active" : ""}`}>
            <span className="rc-step__num">{etapeFaite[i] ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="rc-step__label">{label}</span>
          </li>
        ))}
      </ol>

      {!agentScanne ? (
        <section className="rc-card rc-welcome">
          <div className="rc-welcome__icon"><UserCheck size={34} strokeWidth={1.6} /></div>
          <div className="rc-welcome__body">
            <span className="rc-eyebrow">{t('tri.no_agent_title')}</span>
            <h2>{t('tri.welcome_title', "Poste de tri")}</h2>
            <div className="rc-scan__field" style={{ "--scan": "var(--rc-sac)" }}>
              <ScanInput
                ref={scanInputRef}
                placeholder=""
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleScanAgent}
                borderColor={getBorderColor()}
                keepFocus={true}
                autoDebounce={true}
                disabled
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="rc-layout">
          <div className="rc-main">
            <section className="rc-card rc-scan">
              <header className="rc-scan__bar">
                <span className="rc-scan__title"><ScanLine size={17} /> {t("tri.scan_title", "Scan du linge")}</span>
                <span className="rc-mode"><i /> {modeScan === MODE_RFID ? t('tri.mode_rfid') : t('tri.mode_barcode')}</span>
              </header>
              <div className="rc-scan__body">
                <div className="rc-scan__field">
                  <ScanInput
                    ref={scanInputRef}
                    placeholder=""
                    value={scanValue}
                    onChange={setScanValue}
                    onSubmit={handleScanLinge}
                    borderColor={getBorderColor()}
                    keepFocus={true}
                    autoDebounce={true}
                    disabled={isLoading || showDialog}
                  />
                </div>
                {isLoading && (
                  <div className="tr-loading"><Loader2 size={15} className="animate-spin" /> {t('common.loading')}</div>
                )}
                {lingeCourant && !lotSuggere && (
                  <div className="tr-current">
                    <CategoryTile categorie={lingeCourant.categorie} size={40} />
                    <div className="tr-current__text">
                      <span className="rc-label">{t('tri.last_scanned')}</span>
                      <code>{lingeCourant.codeSuivi || lingeCourant.codeBarre}</code>
                      <small>{[lingeCourant.designation, lingeCourant.poids != null ? `${lingeCourant.poids} kg` : null].filter(Boolean).join(" · ")}</small>
                    </div>
                    <GroupeLavageBadge groupe={lingeCourant.groupeLavage} />
                    <TypeCollecte type={lingeCourant.typeCollecte} />
                  </div>
                )}
              </div>
            </section>

            {lotSuggere && (
              <section className={`rc-card rc-ticket ${String(lotSuggere.typeCollecte || "").toUpperCase().startsWith("INFECT") ? "is-sac" : ""}`}>
                <div className="rc-ticket__banner">
                  <CheckCircle size={16} />
                  <strong>{t('tri.lot_affected')}</strong>
                  <span className={`rc-pill ${lotEnTri ? "rc-pill--ok" : "rc-pill--warn"} tr-ticket__pill`}>
                    <i /> {t(`lot_status.${etatLot(lotSuggere.codeBac, lotSuggere.etat)}`, etatLot(lotSuggere.codeBac, lotSuggere.etat))}
                  </span>
                </div>
                <div className="tr-ticket__body">
                  <div className="tr-ticket__basket">
                    <LotBasketSvg code={lotSuggere.codeBac} poids={lotPoids} capacite={0} />
                  </div>
                  <div className="tr-ticket__info">
                    <div className="rc-ticket__main">
                      <span className="rc-label">{t('tri.bac', 'Bac')}</span>
                      <code className="rc-ticket__code">{lotSuggere.codeBac}</code>
                      {historiqueTri[0] && (
                        <span className="tr-route">
                          <code>{historiqueTri[0].codeLinge}</code>
                          <ArrowRight size={13} />
                          <code>{lotSuggere.codeBac}</code>
                        </span>
                      )}
                    </div>
                    <dl className="rc-ticket__meta tr-ticket__meta">
                      <div><dt>{t('tri.type')}</dt><dd className="tr-ticket__small"><TypeCollecte type={lotSuggere.typeCollecte} /></dd></div>
                      <div><dt>{t('groupe_lavage.label', 'Groupe')}</dt><dd className="tr-ticket__small"><GroupeLavageBadge groupe={lotSuggere.groupeLavage} vide="—" /></dd></div>
                      <div><dt>{t('chargement.declared_weight', 'Poids déclaré')}</dt><dd>{lotPoids.toFixed(2)} <small>kg</small></dd></div>
                      <div>
                        <dt>{t('chargement.scale', 'Balance')}</dt>
                        <dd>{balanceLot(lotSuggere.codeBac, lotSuggere.poidsBalance) != null ? <>{Number(balanceLot(lotSuggere.codeBac, lotSuggere.poidsBalance)).toFixed(2)} <small>kg</small></> : "—"}</dd>
                      </div>
                    </dl>
                  </div>
                  {lotEnTri && (
                    <button type="button" className="rc-btn rc-btn--primary rc-btn--lg" onClick={() => ouvrirValidation(lotSuggere)}>
                      <ClipboardCheck size={16} /> {t('chargement.validate_bac', 'Valider le bac')}
                    </button>
                  )}
                </div>
              </section>
            )}

            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><History size={15} /> {t('tri.history')}</h3>
                <span className="rc-count">{historiqueTri.length}</span>
                <VueSwitch value={vueHistorique} onChange={setVueHistorique} compact />
              </div>
              <div className="rc-card__body">
                {historiqueTri.length === 0 ? (
                  <div className="rc-empty">
                    <History size={26} strokeWidth={1.4} />
                    <strong>{t('tri.no_history')}</strong>
                  </div>
                ) : vueHistorique === "tableau" ? (
                  <DataTable
                    columns={{
                      codeLinge: { label: t('tri.code', 'Code'), render: (h) => <Code>{h.codeLinge}</Code> },
                      groupeLavage: { label: t('groupe_lavage.label', 'Groupe'), render: (h) => <GroupeLavageBadge groupe={h.groupeLavage} vide="—" /> },
                      typeCollecte: { label: t('tri.type'), render: (h) => <TypeCollecte type={h.typeCollecte} /> },
                      lotCode: { label: t('tri.lot', 'Lot'), render: (h) => <Badge variant="info">{h.lotCode}</Badge> },
                      poids: { label: t('tri.weight'), render: (h) => (h.poids != null ? `${h.poids} kg` : "—") },
                      date: { label: t('tri.time', 'Heure'), render: (h) => h.date },
                    }}
                    rows={historiqueTri}
                    rowKey={(h) => `${h.codeLinge}-${h.date}`}
                  />
                ) : (
                  <div className="rc-grid">
                    {historiqueTri.map((item, index) => {
                      const { Icon, accent } = getCategorieMeta(item.categorie);
                      return (
                        <motion.div
                          key={`${item.codeLinge}-${historiqueTri.length - index}`}
                          className={`rc-item tr-hist ${index === 0 ? "is-active" : ""}`}
                          style={{ "--c": accent }}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <span className="rc-item__icon"><Icon size={20} strokeWidth={1.9} /></span>
                          <span className="rc-item__body">
                            <span className="rc-item__code">{item.codeLinge}</span>
                            <span className="rc-item__cat"><GroupeLavageBadge groupe={item.groupeLavage} vide="—" /></span>
                            <span className="rc-item__foot">
                              <span className="tr-route"><ArrowRight size={12} /><code>{item.lotCode}</code></span>
                              <TypeCollecte type={item.typeCollecte} />
                            </span>
                            <span className="rc-item__foot" style={{ marginTop: 6 }}>
                              <span className="tr-time">{item.poids != null ? `${item.poids} kg` : ""}</span>
                              <span className="tr-time">{item.date}</span>
                            </span>
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="rc-side">
            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><ClipboardList size={15} /> {t("reception.balance_title", "Bilan de la session")}</h3>
              </div>
              <div className="rc-stats">
                <div className="rc-stat"><span className="rc-stat__value">{statistiques.totalTrie || 0}</span><span className="rc-stat__label">{t('tri.articles_tried')}</span></div>
                <div className="rc-stat"><span className="rc-stat__value">{statistiques.lotsUtilises || 0}</span><span className="rc-stat__label">{t('tri.lots_used')}</span></div>
                <div className="rc-stat"><span className="rc-stat__value">{Number(statistiques.poidsTotal || 0).toFixed(1)}</span><span className="rc-stat__label">{t('tri.total_weight')} (kg)</span></div>
                <div className="rc-stat"><span className="rc-stat__value rc-stat__value--text">{lotSuggere?.codeBac || "—"}</span><span className="rc-stat__label">{t('tri.last_lot')}</span></div>
              </div>
            </section>

            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><Boxes size={15} /> {t('tri.session_lots')}</h3>
                <span className="rc-count">{lotsSession.length}</span>
              </div>
              {lotsSession.length === 0 ? (
                <div className="rc-empty">
                  <Boxes size={26} strokeWidth={1.4} />
                  <strong>{t('tri.session_lots_empty')}</strong>
                </div>
              ) : (
                <div className="rc-log tr-log">
                  <div className="rc-log__row rc-log__row--head">
                    <span>{t('tri.bac', 'Bac')}</span>
                    <span className="is-num">{t('reception.linges_count')}</span>
                    <span className="is-num">kg</span>
                    <span />
                  </div>
                  {lotsSession.map((l) => (
                    <div key={l.code} className={`rc-log__row ${l.code === lotSuggere?.codeBac ? "is-last" : ""}`}>
                      <span className="rc-log__code">
                        <code>{l.code}</code>
                      </span>
                      <span className="is-num">{l.n}</span>
                      <span className="is-num">{l.poids.toFixed(1)}</span>
                      {etatLot(l.code) === "EN_TRI" ? (
                        <button type="button" className="tr-lots__validate" onClick={() => ouvrirValidation(l)} title={t('chargement.validate_bac', 'Valider le bac')}>
                          <ClipboardCheck size={15} />
                        </button>
                      ) : (
                        <span className="rc-pill rc-pill--ok" title={t(`lot_status.${etatLot(l.code)}`, etatLot(l.code))}><i /> {t('chargement.ready_short', 'Prêt')}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="rc-foot">
              <span>{t("reception.agent")} : <b>{nomAgent}</b></span>
              <span>{new Date().toLocaleDateString("fr-FR")}</span>
            </div>
          </aside>
        </div>
      )}

      {showStats && (
        <QuickStats
          title={t("tri.title")}
          subtitle={nomAgent || undefined}
          onClose={() => setShowStats(false)}
          kpis={[
            { label: t('tri.articles_tried'), value: statistiques.totalTrie || 0 },
            { label: t('tri.lots_used'), value: statistiques.lotsUtilises || 0, color: "#10b981" },
            { label: t('tri.total_weight'), value: `${Number(statistiques.poidsTotal || 0).toFixed(1)} kg`, color: "#6366f1" },
            { label: t('tri.last_lot'), value: lotSuggere?.codeBac || "—", color: "#f59e0b" },
          ]}
          repartitions={[{
            title: t('tri.by_category'),
            items: Object.entries(parCategorie).map(([cat, n]) => ({ label: libelleCategorie(cat), value: n, color: getCategorieMeta(cat).accent })),
          }]}
          classements={[{
            title: t('tri.session_lots'),
            items: lotsSession.map((l) => ({ label: l.code, value: l.n })),
          }]}
        />
      )}
    </div>
  );
}

const initialesTri = (nom = "") =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

/* ── Aides ─────────────────────────────────────────────────────────────── */

/** Icône de la catégorie sur une tuile teintée. */
function CategoryTile({ categorie, size = 40, bare = false }) {
  const { Icon, accent } = getCategorieMeta(categorie);
  const icon = <Icon size={Math.round(size * 0.55)} strokeWidth={1.8} color={accent} />;
  if (bare) return icon;
  return (
    <span className="rc-item__icon" style={{ "--c": accent, width: size, height: size, borderRadius: Math.round(size * 0.3) }}>
      {icon}
    </span>
  );
}

/** Pastille BLANC / INFECTE. */
function TypeCollecte({ type }) {
  if (!type) return null;
  const infecte = String(type).toUpperCase().startsWith("INFECT");
  return (
    <span className={`tr-type ${infecte ? "tr-type--infecte" : "tr-type--blanc"}`}>
      <i /> {type}
    </span>
  );
}

export default function TriList() {
  return <TriProvider><TriInner /></TriProvider>;
}