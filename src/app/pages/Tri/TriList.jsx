import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LingeContext } from "../../contextes/LingeContext";
import { useModal } from "../../contextes/ModalContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Boxes, CheckCircle, History, Loader2, LogOut, PieChart, RotateCcw, Scale, Tag, X,
} from "lucide-react";
import { STATS_INITIALES, MODE_RFID, MODE_CODEBARRE } from "../../constants/tri";
import { LotBasketCard, LotBasketSvg, getFillTone } from "../../components/utils/shared/LotBasket";
import { getCategorieMeta } from "../../constants/categoriesLinge";
import { BadgeScanArt, ScannerGlyph } from "../Reception/ReceptionArt";
import { SortArt, SortGlyph } from "./TriArt";
import "../Linge/WorkflowList.css";
import "../Reception/Reception.css";
import "./Tri.css";
import { TriProvider, useTri } from "../../contextes/TriContext";
import ScanInput from "../../components/utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../services/agentService";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

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
      const res = await fetch(`${API_URL}/api/tri/lots/suggestion?codeOuTag=${encodeURIComponent(code)}`);
      if (res.ok) {
        const lots = await res.json();
        return lots;
      }
      return [];
    } catch (err) {
      console.error("Erreur suggestion lots:", err);
      return [];
    }
  }, []);

  const affecterAuLot = useCallback(async (lotId) => {
    if (!lingeEnCours || !agentScanne) return;

    setIsLoading(true);
    try {
      const payload = {
        matriculeAgent: agentScanne.matricule,
        codeOuTag: lingeEnCours.codeSuivi || lingeEnCours.codeBarre || lingeEnCours.rfidTag,
        lotId: lotId
      };

      const res = await fetch(`${API_URL}/api/tri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.text();
        let msg = error;
        try { msg = JSON.parse(error).message || error; } catch {}
        throw new Error(msg);
      }

      const lot = await res.json();
      setLotSuggere(lot);
      setShowDialog(false);
      setLingeEnCours(null);
      setLotsSuggere([]);

      setHistoriqueTri(prev => [{
        codeLinge: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
        categorie: lingeEnCours.categorie,
        typeCollecte: lingeEnCours.typeCollecte,
        lotCode: lot.codeLot,
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
        t('tri.tri_success_text', {
          code: lingeEnCours.codeSuivi || lingeEnCours.codeBarre,
          lotCode: lot.codeLot,
          poids: lot.poidsActuel?.toFixed(2) || "0",
          capacite: lot.capaciteMax || "0",
          categorie: lot.categorie,
          typeCollecte: lot.typeCollecte
        }),
        "success"
      );

      setTimeout(() => { if (isMounted.current) setLingeScanne(null); }, 2000);

    } catch (err) {
      console.error("Erreur affectation:", err);
      showAlert(t('tri.tri_error'), t('tri.tri_error_text', { message: err.message }), "error");
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
      
      if (lots.length === 0) {
        showAlert(
          t('tri.no_lot_available_title'),
          t('tri.no_lot_available_message', {
            categorie: linge.categorie,
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
      showAlert(t('tri.tri_error'), t('tri.tri_error_text', { message: err.message }), "error");
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
    if (!agentScanne) return "#dc2626";
    return "#e67700";
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

  const lotPoids = Number(lotSuggere?.poidsActuel) || 0;
  const lotCapacite = Number(lotSuggere?.capaciteMax) || 0;
  const lotPct = lotCapacite > 0 ? Math.min(100, (lotPoids / lotCapacite) * 100) : null;
  const lotTone = getFillTone(lotPct);

  const lingeCourant = lingeEnCours || lingeScanne;

  return (
    <div className="collecte-container rc">

      {/* ── Fenêtre de choix du lot ── */}
      <AnimatePresence>
        {showDialog && lotsSuggere.length > 0 && (
          <motion.div className="tr-modal" data-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className={`tr-modal__box ${lotsSuggere.length > 2 ? "" : "is-narrow"}`}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
            >
              <div className="tr-modal__head">
                <CategoryTile categorie={lingeEnCours?.categorie} size={44} />
                <div style={{ minWidth: 0 }}>
                  <h2>{t('tri.choose_lot')}</h2>
                  <p>
                    <code style={{ fontWeight: 700, color: "var(--rc-text)" }}>{lingeEnCours?.codeSuivi || lingeEnCours?.codeBarre}</code>
                    <span>{libelleCategorie(lingeEnCours?.categorie)}</span>
                    <TypeCollecte type={lingeEnCours?.typeCollecte} />
                  </p>
                </div>
                <button type="button" className="tr-modal__close" onClick={fermerDialogue} aria-label={t('common.close')}>
                  <X size={16} />
                </button>
              </div>
              <div className="tr-modal__body">
                <div className="tr-modal__hint">
                  <SortGlyph size={20} /> {t('tri.choose_lot_hint', { count: lotsSuggere.length })}
                </div>
                <div className="lot-basket-grid">
                  {lotsSuggere.map((lot, index) => (
                    <LotBasketCard key={lot.id || index} lot={lot} t={t} onSelect={() => affecterAuLot(lot.id)} />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── En-tête ── */}
      <header className="page-head rc-head">
        <div className="rc-head__title">
          <PageHeaderIcon size={52} />
          <div>
            <h1>{t('tri.title')}</h1>
            <p>{agentScanne ? t('tri.ready_text') : t('tri.subtitle_no_agent')}</p>
          </div>
        </div>
        <div className="rc-head__right">
          {agentScanne && (
            <div className="rc-agent">
              <span className="rc-agent__avatar">{initiales(nomAgent)}</span>
              <span>
                <span className="rc-agent__name" style={{ display: "block" }}>{nomAgent}</span>
                <span className="rc-agent__id">{agentScanne.codeBarre || agentScanne.matricule}</span>
              </span>
              <button type="button" className="rc-agent__out" onClick={handleLogoutAgent} title={t('tri.confirm_logout')} aria-label={t('tri.confirm_logout')}>
                <LogOut size={14} />
              </button>
            </div>
          )}
          <button type="button" className="rc-btn" onClick={handleResetAll}>
            <RotateCcw size={14} /> {t('tri.reset')}
          </button>
        </div>
      </header>

      {/* ── Aucun agent : accueil ── */}
      {!agentScanne ? (
        <section className="rc-card rc-welcome">
          <BadgeScanArt />
          <div>
            <span className="rc-eyebrow">{t('tri.no_agent_title')}</span>
            <h2>{t('tri.welcome_title')}</h2>
            <p>{t('tri.no_agent_message')}</p>
            <div className="rc-scan__field" style={{ "--scan": "var(--rc-sac)" }}>
              <ScanInput
                ref={scanInputRef}
                placeholder={getPlaceholder()}
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
          {/* ═══ Colonne principale ═══ */}
          <div className="rc-main">
            {/* Zone de scan */}
            <section className="rc-card rc-scan">
              <div className="rc-scan__top">
                <ScannerGlyph />
                <div style={{ minWidth: 0 }}>
                  <h2>{t('tri.scan_title')}</h2>
                  <p>{t('tri.ready_text')}</p>
                </div>
                <span className="rc-mode">
                  <i /> {modeScan === MODE_RFID ? t('tri.mode_rfid') : t('tri.mode_barcode')}
                </span>
              </div>
              <div className="rc-scan__field">
                <ScanInput
                  ref={scanInputRef}
                  placeholder={getPlaceholder()}
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
                <div className="rc-scan__opts" style={{ color: "var(--rc-muted)", fontSize: 13 }}>
                  <Loader2 size={15} className="animate-spin" /> {t('common.loading')}
                </div>
              )}
            </section>

            {/* Linge en cours de tri */}
            <AnimatePresence mode="popLayout">
              {lingeCourant && !lotSuggere && (
                <motion.section
                  key={lingeCourant.codeSuivi || lingeCourant.codeBarre}
                  className="rc-card rc-spot"
                  style={{ "--k": getCategorieMeta(lingeCourant.categorie).accent }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="rc-spot__art">
                    <CategoryTile categorie={lingeCourant.categorie} size={46} bare />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="rc-spot__type">{t('tri.last_scanned')}</span>
                    <code className="rc-spot__code">{lingeCourant.codeSuivi || lingeCourant.codeBarre}</code>
                    <div className="rc-spot__meta">
                      <span><b>{libelleCategorie(lingeCourant.categorie)}</b></span>
                      <TypeCollecte type={lingeCourant.typeCollecte} />
                      {lingeCourant.poids != null && <span><Scale size={12} /> {lingeCourant.poids} {t('tri.weight')}</span>}
                    </div>
                  </div>
                  {showDialog && (
                    <span className="rc-pill rc-pill--warn"><i /> {t('tri.choose_lot')}</span>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Lot affecté */}
            <AnimatePresence mode="popLayout">
              {lotSuggere && (
                <motion.section
                  key={`${lotSuggere.codeLot}-${historiqueTri.length}`}
                  className="rc-card tr-lot"
                  style={{ "--k": lotTone.main }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <LotBasketSvg code={lotSuggere.codeLot} poids={lotPoids} capacite={lotCapacite} />
                  <div style={{ minWidth: 0 }}>
                    <span className="rc-spot__type" style={{ "--k": "var(--rc-ok)" }}>
                      <CheckCircle size={12} /> {t('tri.lot_affected')}
                    </span>
                    <code className="rc-spot__code">{lotSuggere.codeLot}</code>
                    {historiqueTri[0] && (
                      <span className="tr-route">
                        <code>{historiqueTri[0].codeLinge}</code>
                        <ArrowRight size={13} />
                        <code>{lotSuggere.codeLot}</code>
                      </span>
                    )}
                    <div className="tr-lot__fields">
                      <div className="tr-field"><small>{t('tri.type')}</small><TypeCollecte type={lotSuggere.typeCollecte} /></div>
                      <div className="tr-field"><small>{t('tri.category')}</small><b>{libelleCategorie(lotSuggere.categorie)}</b></div>
                      <div className="tr-field"><small>{t('tri.weight')}</small><b>{lotPoids.toFixed(2)} / {lotCapacite || "—"} kg</b></div>
                      <div className="tr-field">
                        <small>{t('tri.status')}</small>
                        <span className={`rc-pill ${lotSuggere.etat === "EN_TRI" ? "rc-pill--ok" : "rc-pill--warn"}`}><i /> {lotSuggere.etat}</span>
                      </div>
                    </div>
                    {lotPct != null && (
                      <div className="tr-gauge" title={`${Math.round(lotPct)} %`}>
                        <span style={{ width: `${lotPct}%` }} />
                      </div>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Historique de la session */}
            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><History size={16} /> {t('tri.history')}</h3>
                <span className="rc-count" style={{ marginLeft: "auto" }}>{historiqueTri.length}</span>
              </div>
              <div className="rc-card__body">
                {historiqueTri.length === 0 ? (
                  <div className="rc-empty">
                    <SortArt />
                    <strong>{t('tri.no_history')}</strong>
                    <span>{t('tri.history_empty_hint')}</span>
                  </div>
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
                            <span className="rc-item__cat">{libelleCategorie(item.categorie)}</span>
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

          {/* ═══ Colonne de droite ═══ */}
          <aside className="rc-side">
            <div className="rc-kpis">
              <Kpi color="var(--rc)" icon={<SortGlyph size={22} c="currentColor" />} value={statistiques.totalTrie || 0} label={t('tri.articles_tried')} />
              <Kpi color="var(--rc-ok)" icon={<Boxes size={18} />} value={statistiques.lotsUtilises || 0} label={t('tri.lots_used')} />
              <Kpi color="#7c3aed" icon={<Scale size={18} />} value={`${Number(statistiques.poidsTotal || 0).toFixed(1)} ${t('tri.weight')}`} label={t('tri.total_weight')} />
              <Kpi color="var(--rc-bac)" icon={<Tag size={17} />} text value={lotSuggere?.codeLot || "—"} label={t('tri.last_lot')} />
            </div>

            {historiqueTri.length > 0 && (
              <section className="rc-card">
                <div className="rc-card__head">
                  <h3 className="rc-card__title"><PieChart size={16} /> {t('tri.by_category')}</h3>
                </div>
                <div className="rc-card__body">
                  <div className="rc-dist" style={{ marginBottom: 0 }}>
                    <div className="rc-dist__bar" aria-hidden="true">
                      {Object.entries(parCategorie).map(([cat, n]) => (
                        <span key={cat} style={{ flexGrow: n, background: getCategorieMeta(cat).accent }} />
                      ))}
                    </div>
                    <div className="rc-chips">
                      {Object.entries(parCategorie).map(([cat, n]) => (
                        <span key={cat} className="rc-chip" style={{ "--c": getCategorieMeta(cat).accent }}>
                          <i /> {libelleCategorie(cat)} <b>{n}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><Boxes size={16} /> {t('tri.session_lots')}</h3>
                <span className="rc-count" style={{ marginLeft: "auto" }}>{lotsSession.length}</span>
              </div>
              <div className="rc-card__body">
                {lotsSession.length === 0 ? (
                  <div className="rc-empty" style={{ padding: "14px 8px" }}>
                    <span>{t('tri.session_lots_empty')}</span>
                  </div>
                ) : (
                  <div className="tr-lots">
                    {lotsSession.map((l) => (
                      <div key={l.code} className={`tr-lots__item ${l.code === lotSuggere?.codeLot ? "is-last" : ""}`}>
                        <span className="tr-lots__glyph"><SortGlyph size={22} /></span>
                        <span className="tr-lots__main">
                          <code>{l.code}</code>
                          <small>{libelleCategorie(l.categorie)} · {l.typeCollecte}</small>
                        </span>
                        <span className="tr-lots__n">
                          {l.n} {t('reception.linges_count')}
                          <small>{l.poids.toFixed(1)} kg</small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="rc-foot">
              <span>{t('tri.matricule')} : <b style={{ color: "var(--rc-text)" }}>{agentScanne.matricule}</b></span>
              <span>{new Date().toLocaleDateString("fr-FR")}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── Aides ─────────────────────────────────────────────────────────────── */

const initiales = (nom = "") =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

function Kpi({ color, icon, value, label, text = false }) {
  return (
    <div className="rc-kpi" style={{ "--k": color }}>
      <span className="rc-kpi__icon">{icon}</span>
      <span className={`rc-kpi__value ${text ? "rc-kpi__value--text" : ""}`}>{value}</span>
      <span className="rc-kpi__label">{label}</span>
    </div>
  );
}

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