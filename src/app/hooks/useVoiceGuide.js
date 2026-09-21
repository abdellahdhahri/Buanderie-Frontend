import { useCallback, useEffect, useRef, useState } from "react";
import { MESSAGES } from "../../app/constants/voiceMessages";

const LANG_CONFIG = {
  fr: { lang: "fr-FR", rate: 1.0,  pitch: 1.0 },
  ar: { lang: "ar-SA", rate: 0.95, pitch: 1.0 },
};

const SOUNDS = {
  succes:  { freq: 880, duration: 0.15, type: "sine"     },
  erreur:  { freq: 220, duration: 0.3,  type: "sawtooth" },
  alerte:  { freq: 440, duration: 0.4,  type: "square"   },
  infecte: { freq: 300, duration: 0.5,  type: "sawtooth" },
};

function playBeep(type = "succes", muted = false) {
  if (muted) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const cfg  = SOUNDS[type] || SOUNDS.succes;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + cfg.duration);
  } catch {}
}

export function useVoiceGuide(lang = "fr") {
  const [muted,    setMuted]    = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const queueRef       = useRef([]);
  const speakingRef    = useRef(false);
  const muteRef        = useRef(false);
  const lastMessageRef = useRef(null);
  const lastSoundRef   = useRef(null);
  const idleTimerRef   = useRef(null);

  useEffect(() => { muteRef.current = muted; }, [muted]);

  const processQueue = useCallback(() => {
    if (speakingRef.current || queueRef.current.length === 0) return;
    const { text, cfg } = queueRef.current.shift();
    if (!text) { processQueue(); return; }
    speakingRef.current = true;
    setSpeaking(true);
    const utt    = new SpeechSynthesisUtterance(text);
    utt.lang     = cfg.lang;
    utt.rate     = cfg.rate;
    utt.pitch    = cfg.pitch;
    const voices = window.speechSynthesis.getVoices();
    const best   = voices.find(v => v.lang.startsWith(cfg.lang.split("-")[0]))
                || voices.find(v => v.lang === cfg.lang)
                || null;
    if (best) utt.voice = best;
    utt.onend = utt.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
      setTimeout(processQueue, 80);
    };
    window.speechSynthesis.speak(utt);
  }, []);

  const speak = useCallback((text, soundType = null) => {
    if (muteRef.current || !text) return;

    lastMessageRef.current = text;
    lastSoundRef.current   = soundType;

    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!lastMessageRef.current || muteRef.current) return;
      const cfg    = LANG_CONFIG[lang] || LANG_CONFIG.fr;
      if (lastSoundRef.current) playBeep(lastSoundRef.current, muteRef.current);
      const utt    = new SpeechSynthesisUtterance(lastMessageRef.current);
      utt.lang     = cfg.lang;
      utt.rate     = cfg.rate;
      utt.pitch    = cfg.pitch;
      const voices = window.speechSynthesis.getVoices();
      const best   = voices.find(v => v.lang.startsWith(cfg.lang.split("-")[0])) || null;
      if (best) utt.voice = best;
      window.speechSynthesis.speak(utt);
      idleTimerRef.current = setTimeout(() => {
        if (lastMessageRef.current && !muteRef.current)
          speak(lastMessageRef.current, lastSoundRef.current);
      }, 20_000);
    }, 20_000);

    if (soundType) playBeep(soundType, muteRef.current);
    const cfg = LANG_CONFIG[lang] || LANG_CONFIG.fr;
    queueRef.current.push({ text, cfg });
    processQueue();
  }, [lang, processQueue]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    queueRef.current       = [];
    speakingRef.current    = false;
    setSpeaking(false);
    clearTimeout(idleTimerRef.current);
    lastMessageRef.current = null;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      if (!m) {
        cancel();
        clearTimeout(idleTimerRef.current);
      }
      return !m;
    });
  }, [cancel]);

  useEffect(() => {
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const M = MESSAGES[lang] || MESSAGES.fr;

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
    saySacInfecteOk:          (nb, code)      => speak(M.sac_infecte_ok(nb, code), "alerte"),
    sayContenantErreur:       (msg)           => speak(M.contenant_erreur(msg), "erreur"),
    sayLingePropre:           ()              => speak(M.linge_propre(), "succes"),
    sayLingeManquant:         ()              => speak(M.linge_manquant(), "alerte"),
    sayLingeDejaTraite:       ()              => speak(M.linge_deja_traite(), "alerte"),
    sayTousLitsTraites:       ()              => speak(M.tous_lits_traites(), "succes"),
    sayLitsRestants:          (n)             => speak(M.lits_restants(n)),
    sayClotureOk:             (ch, b, i, p, m) => speak(M.cloture_ok(ch, b, i, p, m), "succes"),
    sayClotureRestants:       (n)             => speak(M.cloture_lits_restants(n), "alerte"),
    sayClotureErreur:         ()              => speak(M.cloture_erreur(), "erreur"),
    sayErreurReseau:          ()              => speak(M.erreur_reseau(), "erreur"),
    sayErreurGenerique:       (msg)           => speak(M.erreur_generique(msg), "erreur"),
    sayCodeNonReconnu:        ()              => speak(M.code_non_reconnu(), "alerte"),

    // ── GUIDE CHAMBRE ──────────────────────────────────────────────
    sayGuidePropresManquants: ()              => speak(M.guide_propre_manquant(), null),
    sayGuideLitEnAttente:     (codeLit)       => speak(M.guide_lit_en_attente(codeLit)),

    // ── SERVICE ────────────────────────────────────────────────────
    sayBienvenueService:      (nom)           => speak(M.bienvenue_service(nom), "succes"),
    sayServiceIdentifie:      (code, nb)      => speak(M.service_identifie(code, nb), "succes"),
    sayBacBlancOkService:     (code)          => speak(M.bac_blanc_ok_service(code), "succes"),
    sayLingeBlanc:            ()              => speak(M.linge_blanc_ok?.("") || "Collecté en blanc.", "succes"),
    sayLingePropresService:   ()              => speak(M.linge_propre_service(), "succes"),
    sayLingeManquantService:  ()              => speak(M.linge_manquant_service(), "alerte"),
    saySacInfecteDeclare:     (total)         => speak(M.sac_infecte_declare(total), "infecte"),
    sayTousTraitesService:    ()              => speak(M.tous_traites_service?.() || "Tous les linges sont traités.", "succes"),
    sayClotureOkService:      (s, b, i, m)   => speak(M.cloture_ok_service(s, b, i, m), "succes"),
    sayClotureErreurService:  ()              => speak(M.cloture_erreur_service?.() || "Impossible de clôturer.", "erreur"),

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