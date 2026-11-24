// pages/Reception/ReceptionList.js
import { useState, useRef, useCallback, useEffect, useContext } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle, RotateCcw, Package, Biohazard, Wifi, Eye, EyeOff,
  Plus, LogOut, ListChecks, Loader2, Search, X, Check, ScanLine, UserCheck, ClipboardList,
} from "lucide-react";
import { ReceptionProvider, useReception } from "../../../contextes/ReceptionContext";
import { LingeContext } from "../../../contextes/LingeContext";
import { getSetting, bipScan } from "../../../utils/appSettings";
import { useCircuitInfecte } from "../../../hooks/useEstablishment";
import ScanInput from "../../utils/shared/ScanInput";
import { getAgent, isAgentConnected } from "../../../services/agentService";
import Swal from "../../kit/dialogueApi";
import LingesSansBac from "../../utils/reception/LingesSansBac";
import { getCategorieMeta } from "../../../constants/categoriesLinge";
import { estBacInfecte } from "../../../services/lavageInfecteService";
import { BacGlyph, EmptyBasketArt } from "./ReceptionArt";
import "./Reception.css";
import { DataTable, Code, VueSwitch, useVue } from "../../kit";


function ReceptionInner() {
  const { t } = useTranslation();
  const circuitInfecte = useCircuitInfecte();

  const {
    agent: agentFromContext,
    bacsRecus = [],
    lingesSansBac = [],
    nouvelleReception,
    dernierRecu,
    bacEnCours,
    scanAgent,
    deconnecterAgent,
    fetchLingesDuBac,
    scanReception,
    passagePortique,
    reset,
    loading = false,
  } = useReception();

  const [scanValue, setScanValue] = useState("");
  // Mode de lecture réglé dans Paramètres › Lecture / Scan
  const { isRfidMode } = useContext(LingeContext);
  const mode = isRfidMode ? "RFID" : "BARCODE";
  const [rfidCodeBac, setRfidCodeBac] = useState("");
  const [rfidTags, setRfidTags] = useState("");
  const [rfidLoading, setRfidLoading] = useState(false);
  const [agent, setAgent] = useState(null);
  const [infecteSansBac, setInfecteSansBac] = useState(false);

  // ✅ États locaux pour l'affichage des linges/items
  const [lingesAffiches, setLingesAffiches] = useState([]);
  const [afficherPanneau, setAfficherPanneau] = useState(false);
  const [loadingPanneau, setLoadingPanneau] = useState(false);
  const [panneauType, setPanneauType] = useState(null);
  const [panneauCode, setPanneauCode] = useState(null);

  const scanInputRef = useRef(null);
  const rfidBacRef = useRef(null);
  const rfidTagsRef = useRef(null);
  const isMounted = useRef(true);
  const heuresVues = useRef({});

  // ─── Récupérer l'agent depuis localStorage ─────────────────────────────
  useEffect(() => {
    const agentData = getAgent();
    if (agentData && isAgentConnected()) {
      const ag = {
        matricule: agentData.codeBarre || agentData.matricule,
        nom: agentData.nom || "Inconnu",
        prenom: agentData.prenom || "",
        nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
        codeBarre: agentData.codeBarre || agentData.matricule,
        id: agentData.id,
        poste: agentData.poste || "AGENT_RECEPTION",
      };
      setAgent(ag);
    } else {
      setAgent(null);
    }
  }, []);

  useEffect(() => {
    if (agentFromContext) {
      setAgent(agentFromContext);
    }
  }, [agentFromContext]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── Focus automatique ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "BARCODE") return;
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, [mode]);

  // ─── Scan auto ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "BARCODE" || scanValue.trim().length < (Number(getSetting("scan.minLength")) || 3)) return;
    const timer = setTimeout(() => {
      bipScan();
      const code = scanValue.trim();
      setScanValue("");

      if (!agent) {
        const agentData = getAgent();
        if (agentData && isAgentConnected()) {
          const ag = {
            matricule: agentData.codeBarre || agentData.matricule,
            nom: agentData.nom || "Inconnu",
            prenom: agentData.prenom || "",
            nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
            codeBarre: agentData.codeBarre || agentData.matricule,
            id: agentData.id,
            poste: agentData.poste || "AGENT_RECEPTION",
          };
          setAgent(ag);
          scanReception(code, ag, { infecte: infecteSansBac });
        } else {
          scanAgent(code);
        }
      } else {
        scanReception(code, agent, { infecte: infecteSansBac });
      }
    }, Math.max(100, (Number(getSetting("scan.delayMs")) || 400) - 100)); // un peu avant le champ de scan : évite un double envoi
    return () => clearTimeout(timer);
  }, [scanValue, mode, agent, scanAgent, scanReception, infecteSansBac]);

  // ─── Soumission manuelle ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");

    if (!agent) {
      const agentData = getAgent();
      if (agentData && isAgentConnected()) {
        const ag = {
          matricule: agentData.codeBarre || agentData.matricule,
          nom: agentData.nom || "Inconnu",
          prenom: agentData.prenom || "",
          nomPrenom: agentData.nomPrenom || agentData.nom || "Inconnu",
          codeBarre: agentData.codeBarre || agentData.matricule,
          id: agentData.id,
          poste: agentData.poste || "AGENT_RECEPTION",
        };
        setAgent(ag);
        scanReception(code, ag, { infecte: infecteSansBac });
      } else {
        scanAgent(code);
      }
    } else {
      scanReception(code, agent, { infecte: infecteSansBac });
    }
  };

  // ─── Portique RFID ──────────────────────────────────────────────────────
  const handlePortique = async () => {
    const tags = rfidTags
      .split(/[\s,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) {
      Swal.fire({
        title: t('reception_alert.rfid_no_tags'),
        text: t('reception_alert.rfid_no_tags_text'),
        icon: "warning",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setRfidLoading(true);
    const result = await passagePortique(rfidCodeBac.trim(), tags, agent);
    setRfidCodeBac("");
    setRfidTags("");
    setRfidLoading(false);

    if (result?.success) {
      Swal.fire({
        title: t('reception_alert.rfid_success'),
        text: t('reception_alert.rfid_success_text', {
          count: tags.length,
          code: rfidCodeBac.trim(),
        }),
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } else if (result?.error) {
      Swal.fire({
        title: t('reception_alert.rfid_error'),
        text: result.message || t('reception_alert.rfid_error_text'),
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // ─── Afficher les linges d'un BAC ──────────────────────────────────────
  const handleVoirLingesBac = async () => {
    if (!bacEnCours) return;
    const bacId = bacEnCours.id || bacEnCours.bacId;
    if (!bacId) return;

    const codeBac = bacEnCours.code || bacEnCours.codeBac;

    // Si déjà ouvert sur ce bac, fermer
    if (afficherPanneau && panneauType === "BAC" && panneauCode === codeBac) {
      setAfficherPanneau(false);
      setLingesAffiches([]);
      setPanneauType(null);
      setPanneauCode(null);
      return;
    }

    setLoadingPanneau(true);
    setAfficherPanneau(true);
    setPanneauType("BAC");
    setPanneauCode(codeBac);

    // Linges présents dans le bac au moment du scan (avant réception)
    const lingesAuScan = bacEnCours.lingesAuScan || bacEnCours.linges || [];

    try {
      const linges = await fetchLingesDuBac(bacId);
      const actuels = Array.isArray(linges) ? linges : [];
      if (isMounted.current) {
        // La réception peut détacher les linges du bac : l'API renvoie alors
        // une liste vide → on affiche ceux relevés au scan
        setLingesAffiches(actuels.length > 0 ? actuels : lingesAuScan);
      }
    } catch (err) {
      console.error("❌ Erreur fetchLingesBac:", err);
      if (isMounted.current) {
        setLingesAffiches(lingesAuScan);
      }
    } finally {
      if (isMounted.current) {
        setLoadingPanneau(false);
      }
    }
  };

  // ─── Fermer le panneau ─────────────────────────────────────────────────
  const handleFermerPanneau = () => {
    setAfficherPanneau(false);
    setLingesAffiches([]);
    setPanneauType(null);
    setPanneauCode(null);
  };

  // ─── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScanValue("");
    setRfidCodeBac("");
    setRfidTags("");
    setLingesAffiches([]);
    setAfficherPanneau(false);
    setPanneauType(null);
    setPanneauCode(null);
    reset();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleNouvelleReception = () => {
    setScanValue("");
    setLingesAffiches([]);
    setAfficherPanneau(false);
    setPanneauType(null);
    setPanneauCode(null);
    setInfecteSansBac(false);
    nouvelleReception();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  // ─── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Swal.fire({
      title: t('reception.confirm_logout'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t('reception.confirm_logout_yes'),
      cancelButtonText: t('reception.confirm_logout_no'),
      confirmButtonColor: "#0794a4",
    }).then((r) => {
      if (r.isConfirmed) {
        deconnecterAgent();
        setAgent(null);
        handleReset();
      }
    });
  };

  const getPlaceholder = () => {
    if (!agent) return t('reception.scan_placeholder_no_agent');
    return t('reception.scan_placeholder');
  };

  const getBorderColor = () => {
    if (!agent) return "#dc2626";
    return "#0794a4";
  };

  // ─── Rendu ────────────────────────────────────────────────────────────
  const nomAgent = agent ? agent.nomPrenom || agent.nom || agent.matricule : "";
  const panneauOuvert = (type) => afficherPanneau && panneauType === type;
  const bacInfecteRecu = dernierRecu?.type === "BAC" && estBacInfecte(dernierRecu.data);
  const nbBacsInfectes = bacsRecus.filter(estBacInfecte).length;
  const nbLingesBac = bacEnCours?.lingesAuScan?.length ?? bacEnCours?.linges?.length ?? null;

  const heuresRef = heuresVues.current;
  const journal = bacsRecus.map((b, i) => {
    const code = b.codeBac || b.code || b.reference;
    if (code && !heuresRef[code]) heuresRef[code] = heure(new Date());
    return {
      key: `b-${i}`,
      type: estBacInfecte(b) ? "BAC_INFECTE" : "BAC",
      code,
      n: b.nombreLinges ?? b.nbLinges ?? b.linges?.length ?? null,
      heure: heuresRef[code] || "—",
    };
  }).reverse();

  const etapeActive = !agent ? 1 : !dernierRecu ? 2 : 3;
  const etapes = [
    { n: 1, label: t("reception.step_identify", "Identification de l'agent"), done: Boolean(agent) },
    { n: 2, label: t("reception.step_scan", "Scan du bac ou du linge"), done: Boolean(dernierRecu) },
    { n: 3, label: t("reception.step_control", "Contrôle du contenu"), done: panneauOuvert("BAC") },
  ];

  return (
    <div className="collecte-container rc">
      <div className="rc-toolbar">
          <div className="rc-head__right">
            {agent && (
              <div className="rc-agent">
                <span className="rc-agent__avatar">{initiales(nomAgent)}</span>
                <span className="rc-agent__text">
                  <span className="rc-agent__name">{nomAgent}</span>
                  <span className="rc-agent__id">{agent.codeBarre || agent.matricule}</span>
                </span>
                <button type="button" className="rc-agent__out" onClick={handleLogout} title={t("reception.logout")} aria-label={t("reception.logout")}>
                  <LogOut size={14} />
                </button>
              </div>
            )}
            {agent && (
              <button type="button" className="rc-btn rc-btn--primary" onClick={handleNouvelleReception}>
                <Plus size={15} /> {t("reception.new_reception")}
              </button>
            )}
            <button type="button" className="rc-btn" onClick={handleReset}>
              <RotateCcw size={14} /> {t("reception.reset")}
            </button>
          </div>
      </div>

      <ol className="rc-steps" aria-label={t("reception.steps", "Étapes de la réception")}>
        {etapes.map((e) => (
          <li key={e.n} className={`rc-step ${e.done ? "is-done" : ""} ${etapeActive === e.n ? "is-active" : ""}`}>
            <span className="rc-step__num">{e.done ? <Check size={14} strokeWidth={3} /> : e.n}</span>
            <span className="rc-step__label">{e.label}</span>
          </li>
        ))}
      </ol>

      {!agent ? (
        <section className="rc-card rc-welcome">
          <div className="rc-welcome__icon"><UserCheck size={34} strokeWidth={1.6} /></div>
          <div className="rc-welcome__body">
            <span className="rc-eyebrow">{t("reception.no_agent_title")}</span>
            <h2>{t("reception.welcome_title")}</h2>
            <div className="rc-scan__field" style={{ "--scan": "var(--rc-sac)" }}>
              <ScanInput
                ref={scanInputRef}
                placeholder=""
                value={scanValue}
                onChange={setScanValue}
                onSubmit={handleSubmit}
                borderColor={getBorderColor()}
                keepFocus={mode === "BARCODE"}
                autoDebounce={true}
                disabled
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="rc-layout">
          <div className="rc-main">
            <section className={`rc-card rc-scan ${infecteSansBac ? "is-infecte" : ""}`}>
              <header className="rc-scan__bar">
                <span className="rc-scan__title"><ScanLine size={17} /> {t("reception.scan_title")}</span>
                <span className="rc-mode">
                  <i /> {mode === "BARCODE" ? t("reception.mode_barcode") : t("reception.mode_rfid")}
                </span>
              </header>
              <div className="rc-scan__body">
                {mode === "BARCODE" ? (
                  <div className={`rc-scan__field ${infecteSansBac ? "is-infecte" : ""}`}>
                    <ScanInput
                      ref={scanInputRef}
                      placeholder=""
                      value={scanValue}
                      onChange={setScanValue}
                      onSubmit={handleSubmit}
                      borderColor={infecteSansBac ? "#b91c1c" : getBorderColor()}
                      keepFocus={true}
                      autoDebounce={true}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="rc-scan__field">
                    <div className="rc-rfid">
                      <label className="rc-input">
                        <Package size={16} />
                        <input
                          type="text"
                          placeholder={t("reception.rfid_bac_code")}
                          value={rfidCodeBac}
                          onChange={(e) => setRfidCodeBac(e.target.value)}
                          ref={rfidBacRef}
                        />
                      </label>
                      <label className="rc-input">
                        <Wifi size={16} />
                        <input
                          type="text"
                          placeholder={t("reception.rfid_tags")}
                          value={rfidTags}
                          onChange={(e) => setRfidTags(e.target.value)}
                          ref={rfidTagsRef}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handlePortique();
                          }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="rc-btn rc-btn--primary rc-btn--block"
                      onClick={handlePortique}
                      disabled={rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()}
                    >
                      {rfidLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      {rfidLoading ? t("reception.rfid_loading") : t("reception.rfid_validate")}
                    </button>
                  </div>
                )}

                {mode === "BARCODE" && circuitInfecte && (
                  <label className={`rc-toggle ${infecteSansBac ? "is-on" : ""}`} title={t("reception.infected_hint")}>
                    <input type="checkbox" checked={infecteSansBac} onChange={(e) => setInfecteSansBac(e.target.checked)} />
                    <span className="rc-toggle__track" />
                    <Biohazard size={16} />
                    <span className="rc-toggle__text">
                      {t("reception.infected")}
                      <small>{t("reception.infected_scope")}</small>
                    </span>
                  </label>
                )}
              </div>
            </section>

            <AnimatePresence mode="popLayout">
              {dernierRecu && dernierRecu.type !== "LINGE" && (
                <motion.section
                  key={dernierRecu.code}
                  className={`rc-card rc-ticket ${bacInfecteRecu ? "is-sac" : ""}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rc-ticket__banner">
                    {bacInfecteRecu ? <Biohazard size={16} /> : <CheckCircle size={16} />}
                    <strong>
                      {bacInfecteRecu
                        ? t("reception.banner_infecte", "Bac infecté réceptionné")
                        : t("reception.banner_ok", "Bac réceptionné")}
                    </strong>
                    <span>{t("reception.last_received")}</span>
                  </div>
                  <div className="rc-ticket__body">
                    <div className="rc-ticket__main">
                      <span className="rc-label">{t("reception.bac_code", "Code du bac")}</span>
                      <code className="rc-ticket__code">{dernierRecu.code}</code>
                    </div>
                    <dl className="rc-ticket__meta">
                      <div>
                        <dt>{t("reception.linges_count")}</dt>
                        <dd>{nbLingesBac != null ? nbLingesBac : "—"}</dd>
                      </div>
                      <div>
                        <dt>{t("reception.time", "Heure")}</dt>
                        <dd>{heuresRef[dernierRecu.code] || heure(new Date())}</dd>
                      </div>
                      <div>
                        <dt>{t("reception.agent")}</dt>
                        <dd className="rc-ticket__agent">{nomAgent}</dd>
                      </div>
                    </dl>
                    {bacEnCours && (
                      <button
                        type="button"
                        className={`rc-btn rc-btn--lg ${panneauOuvert("BAC") ? "is-on" : ""}`}
                        onClick={handleVoirLingesBac}
                      >
                        {panneauOuvert("BAC") ? <EyeOff size={16} /> : <Eye size={16} />}
                        {panneauOuvert("BAC") ? t("reception.hide_linges") : t("reception.see_linges")}
                      </button>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {afficherPanneau && (
              <ArticlesPanel
                key={`${panneauType}-${panneauCode}`}
                code={panneauCode}
                items={lingesAffiches}
                loading={loadingPanneau}
                onClose={handleFermerPanneau}
              />
            )}

            <LingesSansBac
              linges={lingesSansBac}
              dernierCode={dernierRecu?.type === "LINGE" ? dernierRecu.code : null}
            />
          </div>

          <aside className="rc-side">
            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><ClipboardList size={15} /> {t("reception.balance_title", "Bilan de la session")}</h3>
              </div>
              <div className="rc-stats">
                <Stat value={bacsRecus.length} label={t("reception.bacs_received")} />
                {circuitInfecte && <Stat value={nbBacsInfectes} label={t("reception.bacs_infectes", "Bacs infectés")} tone="danger" />}
                <Stat value={lingesSansBac.length} label={t("reception.linges_sans_bac")} />
                <Stat
                  value={dernierRecu ? (dernierRecu.type === "LINGE" ? t("reception.linge") : bacInfecteRecu ? t("reception.bac_infecte", "Bac infecté") : t("reception.bac")) : "—"}
                  label={t("reception.last_received")}
                  text
                />
              </div>
            </section>

            <section className="rc-card">
              <div className="rc-card__head">
                <h3 className="rc-card__title"><ListChecks size={15} /> {t("reception.session_title")}</h3>
                <span className="rc-count">{journal.length}</span>
              </div>
              {journal.length === 0 ? (
                <div className="rc-empty">
                  <Package size={26} strokeWidth={1.4} />
                  <strong>{t("reception.session_empty")}</strong>
                  <span>{t("reception.session_empty_hint")}</span>
                </div>
              ) : (
                <div className="rc-log">
                  <div className="rc-log__row rc-log__row--head">
                    <span>{t("reception.time", "Heure")}</span>
                    <span>{t("reception.bac_code", "Code du bac")}</span>
                    <span className="is-num">{t("reception.linges_count")}</span>
                  </div>
                  {journal.map((j, i) => (
                    <motion.div
                      key={j.key}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rc-log__row ${j.type === "BAC_INFECTE" ? "is-sac" : ""} ${i === 0 ? "is-last" : ""}`}
                    >
                      <span className="rc-log__time">{j.heure}</span>
                      <span className="rc-log__code">
                        {j.type === "BAC_INFECTE" && <Biohazard size={13} />}
                        <code>{j.code}</code>
                      </span>
                      <span className="is-num">{j.n != null ? j.n : "—"}</span>
                    </motion.div>
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
    </div>
  );
}

/* ── Aides ─────────────────────────────────────────────────────────────── */

const initiales = (nom = "") =>
  nom.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const heure = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function Stat({ value, label, tone, text = false }) {
  return (
    <div className={`rc-stat ${tone ? `rc-stat--${tone}` : ""}`}>
      <span className={`rc-stat__value ${text ? "rc-stat__value--text" : ""}`}>{value}</span>
      <span className="rc-stat__label">{label}</span>
    </div>
  );
}

/** Article d'un bac : catégorie, code, état, RFID, poids. */
function ArticleCard({ item, index }) {
  const { t } = useTranslation();
  const { Icon, accent } = getCategorieMeta(item.categorie);
  const recu = item.etat === "RECEPTION";
  return (
    <motion.div
      className="rc-item"
      style={{ "--c": accent }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.025 }}
    >
      <span className="rc-item__icon"><Icon size={20} strokeWidth={1.9} /></span>
      <span className="rc-item__body">
        <span className="rc-item__code">{item.codeBarre || "N/A"}</span>
        <span className="rc-item__cat">
          {item.categorie ? t(`categories.${item.categorie}`, item.categorie) : t("reception.non_categorise")}
        </span>
        {item.designation && <span className="rc-item__desc">{item.designation}</span>}
        <span className="rc-item__foot">
          <span className={`rc-pill ${recu ? "rc-pill--ok" : "rc-pill--warn"}`}>
            <i /> {t(`reception_status.${item.etat}`, item.etat || "N/A")}
          </span>
          {item.rfidTag && <span className="rc-pill rc-pill--rfid">RFID</span>}
          {item.poids && <span className="rc-pill">{item.poids} {t("reception.weight")}</span>}
        </span>
      </span>
    </motion.div>
  );
}

/** Panneau des articles réceptionnés (linges d'un bac). */
function ArticlesPanel({ code, items, loading, onClose }) {
  const { t } = useTranslation();
  const [vue, setVue] = useVue("reception.articles");
  const [filtre, setFiltre] = useState("");
  const [categorie, setCategorie] = useState(null);
  const parCategorie = items.reduce((acc, it) => {
    const cat = it.categorie || "AUTRE";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(parCategorie).reduce((s, n) => s + n, 0);

  const q = filtre.trim().toLowerCase();
  const visibles = items.filter(
    (it) =>
      (!categorie || (it.categorie || "AUTRE") === categorie) &&
      (!q || [it.codeBarre, it.designation, it.categorie].some((v) => String(v || "").toLowerCase().includes(q)))
  );

  return (
    <motion.section
      className="rc-card rc-articles"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rc-card__head">
        <h3 className="rc-card__title">
          <BacGlyph size={22} />
          {t("reception.articles_title")}
        </h3>
        {code && <code className="rc-articles__code">{code}</code>}
        <span className="rc-count">{total}</span>
        <div className="rc-articles__tools">
          <VueSwitch value={vue} onChange={setVue} compact />
          {items.length > 6 && (
            <label className="rc-search">
              <Search size={13} />
              <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder={t("reception.search_article")} />
            </label>
          )}
          <button type="button" className="rc-btn rc-btn--sm" onClick={onClose}>
            <X size={13} /> {t("common.close")}
          </button>
        </div>
      </div>

      <div className="rc-card__body">
        {loading ? (
          <div className="rc-loading">
            <Loader2 size={18} className="animate-spin" /> {t("reception.loading_linges")}
          </div>
        ) : items.length === 0 ? (
          <div className="rc-empty">
            <EmptyBasketArt />
            <strong>{t("reception.no_linge")}</strong>
            <span>{t("reception.empty_bac")}</span>
          </div>
        ) : (
          <>
            <div className="rc-dist">
              <div className="rc-dist__bar" aria-hidden="true">
                {Object.entries(parCategorie).map(([cat, n]) => (
                  <span key={cat} style={{ flexGrow: n, background: getCategorieMeta(cat).accent }} />
                ))}
              </div>
              <div className="rc-chips">
                {Object.entries(parCategorie).map(([cat, n]) => (
                  <button
                    key={cat}
                    type="button"
                    className={`rc-chip ${categorie === cat ? "is-active" : ""}`}
                    style={{ "--c": getCategorieMeta(cat).accent }}
                    onClick={() => setCategorie((c) => (c === cat ? null : cat))}
                  >
                    <i /> {t(`categories.${cat}`, cat)} <b>{n}</b>
                  </button>
                ))}
              </div>
            </div>

            {visibles.length === 0 ? (
              <div className="rc-empty"><strong>{t("reception.no_match")}</strong></div>
            ) : vue === "tableau" ? (
              <DataTable
                columns={{
                  code: { label: t("tri.code", "Code"), render: (it) => <Code>{it.codeBarre}</Code> },
                  categorie: { label: t("tri.category", "Catégorie"), render: (it) => (it.categorie ? t(`categories.${it.categorie}`, it.categorie) : t("reception.non_categorise")) },
                  designation: { label: t("reception.designation", "Désignation"), render: (it) => it.designation || "—" },
                  etat: { label: t("tri.status", "Statut"), render: (it) => t(`reception_status.${it.etat}`, it.etat || "—") },
                }}
                rows={visibles}
                rowKey={(it) => it.id || it.lingeId || it.codeBarre || it.categorie}
              />
            ) : (
              <div className="rc-grid">
                {visibles.map((it, i) => (
                  <ArticleCard key={it.id || it.lingeId || it.codeBarre || i} item={it} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

export default function ReceptionList() {
  return (
    <ReceptionProvider>
      <ReceptionInner />
    </ReceptionProvider>
  );
}
