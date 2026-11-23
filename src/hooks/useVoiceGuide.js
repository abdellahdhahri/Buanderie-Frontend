import { useCallback, useEffect, useRef, useState } from "react";
import { MESSAGES } from "../constants/voiceMessages";
import { getSetting } from "../utils/appSettings";
import {
  hasSpeech, loadVoices, prepareText, splitSentences, makeUtterance, playChime, isForeignForArabic,
} from "../utils/voiceEngine";

// Sons qui interrompent la phrase en cours (l'agent doit réagir tout de suite)
const URGENT = new Set(["erreur", "infecte"]);

export function useVoiceGuide(lang = "fr") {
  // Activation par défaut réglée dans Paramètres › Assistant vocal
  const [muted,    setMuted]    = useState(() => !getSetting("voice.enabled"));
  const [speaking, setSpeaking] = useState(false);

  const queueRef       = useRef([]);   // phrases en attente
  const muteRef        = useRef(muted);
  const lastRef        = useRef(null); // { text, soundType } pour la répétition
  const idleTimerRef   = useRef(null);
  const tokenRef       = useRef(0);    // invalide les lectures obsolètes

  muteRef.current = muted;

  const voiceOptions = () => ({
    rate: getSetting("voice.rate"),
    voiceName: getSetting(lang === "ar" ? "voice.voiceAr" : "voice.voiceFr"),
  });

  // Lit les phrases de la file une par une
  const processQueue = useCallback(() => {
    if (!hasSpeech()) return;
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) return;
    const next = queueRef.current.shift();
    if (!next) { setSpeaking(false); return; }
    const utt = makeUtterance(next, lang, voiceOptions());
    // À la fin d'une phrase on enchaîne sur la file actuelle (elle a pu être
    // remplacée par une consigne plus récente entre-temps)
    utt.onend = utt.onerror = () => setTimeout(processQueue, 120);
    setSpeaking(true);
    synth.speak(utt);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleRepeat = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    const repeatMs = (Number(getSetting("voice.repeatSeconds")) || 0) * 1000;
    if (repeatMs <= 0) return;
    idleTimerRef.current = setTimeout(() => {
      const last = lastRef.current;
      if (!last || muteRef.current) return;
      // eslint-disable-next-line no-use-before-define
      speak(last.text, last.soundType, { repeat: true });
    }, repeatMs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = useCallback(async (text, soundType = null, { repeat = false } = {}) => {
    if (muteRef.current || !text || !hasSpeech()) return;
    if (!repeat) lastRef.current = { text, soundType };

    // La dernière consigne remplace celles qui n'ont pas encore été lues :
    // pas de retard quand l'agent scanne vite
    const token = ++tokenRef.current;
    queueRef.current = [];
    if (URGENT.has(soundType)) window.speechSynthesis.cancel();

    const delay = soundType ? playChime(soundType) : 0;
    await loadVoices();
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (token !== tokenRef.current || muteRef.current) return;

    if (!window.speechSynthesis.speaking) window.speechSynthesis.cancel(); // vide un éventuel blocage
    queueRef.current = splitSentences(prepareText(text, lang));
    processQueue();
    scheduleRepeat();
  }, [lang, processQueue, scheduleRepeat]);

  const cancel = useCallback(() => {
    tokenRef.current++;
    if (hasSpeech()) window.speechSynthesis.cancel();
    queueRef.current = [];
    setSpeaking(false);
    clearTimeout(idleTimerRef.current);
    lastRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      if (!m) cancel();
      return !m;
    });
  }, [cancel]);

  // Précharge les voix ; coupe la voix en quittant l'écran ou en changeant de langue
  useEffect(() => {
    loadVoices();
    return () => {
      tokenRef.current++;
      clearTimeout(idleTimerRef.current);
      if (hasSpeech()) window.speechSynthesis.cancel();
    };
  }, [lang]);

  const M = MESSAGES[lang] || MESSAGES.fr;
  // Message dans la langue choisie, avec repli sur le français
  const msg = (key, ...args) => (M[key] || MESSAGES.fr[key])?.(...args);
  // Détail d'erreur venant du serveur : ignoré s'il n'est pas dans la langue de la voix
  const detail = (text) => (lang === "ar" && isForeignForArabic(text) ? "" : text || "");

  return {
    muted,
    speaking,
    toggleMute,
    cancel,
    speak,

    // ── CHAMBRE ────────────────────────────────────────────────────
    sayBienvenue:             (nom)           => speak(M.bienvenue(nom), "succes"),
    sayChambreIdentifiee:     (code, lits, l) => speak(M.chambre_identifiee(code, lits, l), "succes"),
    sayChambreErreur:         ()              => speak(M.chambre_erreur(), "erreur"),
    sayChambreVide:           ()              => speak(M.chambre_vide(), "alerte"),
    sayLitNormal:             (code, nb)      => speak(M.lit_normal(code, nb), "succes"),
    sayLitInfecte:            (code, nb)      => speak(M.lit_infecte(code, nb), "infecte"),
    sayLitDejaTraite:         (code)          => speak(M.lit_deja_traite(code), "alerte"),
    sayLitVide:               (code)          => speak(M.lit_vide(code), "alerte"),
    sayBacBlancOk:            (nb, code)      => speak(M.bac_blanc_ok(nb, code), "succes"),
    sayBacInfecteOk:          (nb, code)      => speak(M.bac_infecte_ok(nb, code), "alerte"),
    sayContenantErreur:       (msg)           => speak(M.contenant_erreur(detail(msg)), "erreur"),
    sayLingePropre:           ()              => speak(M.linge_propre(), "succes"),
    sayLingeManquant:         ()              => speak(M.linge_manquant(), "alerte"),
    sayLingeDejaTraite:       ()              => speak(M.linge_deja_traite(), "alerte"),
    sayTousLitsTraites:       ()              => speak(M.tous_lits_traites(), "succes"),
    sayLitsRestants:          (n)             => speak(M.lits_restants(n)),
    sayClotureOk:             (ch, b, i, p, m) => speak(M.cloture_ok(ch, b, i, p, m), "succes"),
    sayClotureRestants:       (n)             => speak(M.cloture_lits_restants(n), "alerte"),
    sayClotureErreur:         ()              => speak(M.cloture_erreur(), "erreur"),
    sayErreurReseau:          ()              => speak(M.erreur_reseau(), "erreur"),
    sayErreurGenerique:       (msg)           => speak(M.erreur_generique(detail(msg)), "erreur"),
    sayCodeNonReconnu:        ()              => speak(M.code_non_reconnu(), "alerte"),

    // ── Dialogue du lit (écran tactile) ──────────────────────────────
    sayGuideChambre:          ()              => speak(msg("guide_chambre")),
    saySelectionVide:         ()              => speak(msg("selection_vide"), "alerte"),
    sayToutCoche:             (n)             => speak(msg("tout_coche", n)),
    sayToutDecoche:           ()              => speak(msg("tout_decoche")),
    sayLingesRestantsLit:     (n)             => speak(msg("linges_restants_lit", n), "alerte"),
    sayGuideInfecte:          ()              => speak(msg("guide_infecte"), "infecte"),
    sayScannerBacInfecte:     ()              => speak(msg("scanner_bac_infecte")),
    sayLingeInfecteOk:        ()              => speak(msg("linge_infecte_ok"), "infecte"),

    // ── DISTRIBUTION CHAMBRE ─────────────────────────────────────────
    sayBienvenueDistribution: (nom)           => speak(msg("bienvenue_distribution", nom), "succes"),
    sayChambreDistribution:   (code, l, d)    => speak(msg("chambre_distribution", code, l, d), "succes"),
    sayChambreDistributionVide: (code)        => speak(msg("chambre_distribution_vide", code), "alerte"),
    sayLitDistribution:       (code, inf)     => speak(msg("lit_distribution", code, inf), inf ? "infecte" : null),
    sayChoisirLit:            ()              => speak(msg("choisir_lit"), "alerte"),
    sayLingePose:             (code, nb)      => speak(msg("linge_pose", code, nb), "succes"),
    sayTousLingesPoses:       ()              => speak(msg("tous_linges_poses"), "succes"),
    sayAucunLingeDistribue:   ()              => speak(msg("aucun_linge_distribue"), "alerte"),
    sayDistributionTerminee:  (ch, nb, lits)  => speak(msg("distribution_terminee", ch, nb, lits), "succes"),

    // Annonce générique par clé de message : sayMsg("lavage_termine", "succes")
    sayMsg:                   (key, sound = null, ...args) => speak(msg(key, ...args), sound),

    // ── DISTRIBUTION SERVICE ─────────────────────────────────────────
    sayBienvenueDistributionService: (nom)    => speak(msg("bienvenue_distribution_service", nom), "succes"),
    sayServiceDistribution:   (nom, reste)    => speak(msg("service_distribution", nom, reste), "succes"),
    sayArticleLivre:          (reste)         => speak(msg("article_livre", reste), "succes"),
    sayArticleRefuse:         (m)             => speak(msg("article_refuse", detail(m)), "erreur"),
    sayDistributionServiceComplete: ()        => speak(msg("distribution_service_complete"), "succes"),
    sayArticlesRestantsCloture: (n)           => speak(msg("articles_restants_cloture", n), "alerte"),
    sayDistributionServiceCloturee: (nom)     => speak(msg("distribution_service_cloturee", nom), "succes"),

    // ── DISTRIBUTION UNIFORME ────────────────────────────────────────
    sayBienvenueDistributionUniforme: (nom)   => speak(msg("bienvenue_distribution_uniforme", nom), "succes"),
    sayPersonnelDistribution: (nom, nb)       => speak(msg("personnel_distribution", nom, nb), nb > 0 ? "succes" : "alerte"),
    sayScannerPersonnelDabord: ()             => speak(msg("scanner_personnel_d_abord"), "alerte"),
    sayUniformeDistribue:     (n)             => speak(msg("uniforme_distribue", n), "succes"),
    sayUniformeRetire:        ()              => speak(msg("uniforme_retire")),
    sayAucunUniformeDistribue: ()             => speak(msg("aucun_uniforme_distribue"), "alerte"),
    sayDistributionUniformeTerminee: (nom, n) => speak(msg("distribution_uniforme_terminee", nom, n), "succes"),

    // ── GUIDE CHAMBRE ──────────────────────────────────────────────
    sayGuidePropresManquants: ()              => speak(M.guide_propre_manquant(), null),
    sayGuideLitEnAttente:     (codeLit)       => speak(M.guide_lit_en_attente(codeLit)),

    // ── SERVICE ────────────────────────────────────────────────────
    sayBienvenueService:      (nom)           => speak(M.bienvenue_service(nom), "succes"),
    sayServiceIdentifie:      (code, nb)      => speak(M.service_identifie(code, nb), "succes"),
    sayBacBlancOkService:     (code)          => speak(M.bac_blanc_ok_service(code), "succes"),
    sayLingeBlanc:            ()              => speak(msg("linge_blanc_ok"), "succes"),
    sayLingePropresService:   ()              => speak(M.linge_propre_service(), "succes"),
    sayLingeManquantService:  ()              => speak(M.linge_manquant_service(), "alerte"),
    sayBacInfecteDeclare:     (total)         => speak(M.bac_infecte_declare(total), "infecte"),
    sayTousTraitesService:    ()              => speak(msg("tous_traites_service"), "succes"),
    sayClotureOkService:      (s, b, i, m)   => speak(M.cloture_ok_service(s, b, i, m), "succes"),
    sayClotureErreurService:  ()              => speak(msg("cloture_erreur_service"), "erreur"),

    // ── UNIFORME ───────────────────────────────────────────────────
    sayBienvenueUniforme:     (nom)           => speak(M.bienvenue_uniforme(nom), "succes"),
    sayBadgeOk:               (nom, nb, inf)  => speak(M.badge_ok(nom, nb, inf), inf ? "infecte" : "succes"),
    sayUniformeOk:            (code, inf)     => speak(M.uniforme_ok(code, inf), inf ? "infecte" : "succes"),
    sayGuideManquant:         ()              => speak(M.guide_manquant(), null),
    sayBacBlancOkUniforme:    (code)          => speak(M.bac_blanc_ok_uniforme(code), "succes"),
    sayBacRougeOk:            (code)          => speak(M.bac_rouge_ok(code), "infecte"),
    sayClotureOkUniforme:     (nom, b, i, m)  => speak(M.cloture_ok_uniforme(nom, b, i, m), "succes"),
  };
}