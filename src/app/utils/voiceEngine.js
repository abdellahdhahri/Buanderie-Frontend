/* ═══════════════════════════════════════════════════════════════════════════
   MOTEUR VOCAL — choix de la meilleure voix, préparation du texte (codes,
   nombres), découpage en phrases et bips. Utilisé par useVoiceGuide et par
   Paramètres › Assistant vocal.
   ═══════════════════════════════════════════════════════════════════════════ */

export const LANG_CONFIG = {
  fr: { lang: "fr-FR", rate: 1.0, pitch: 1.0 },
  // Les voix arabes sont rapides par défaut : on ralentit légèrement
  ar: { lang: "ar-SA", rate: 0.88, pitch: 1.0 },
};

// Voix arabes : on privilégie les variantes maghrébines puis l'arabe standard
const LOCALE_PREFERENCE = {
  fr: ["fr-FR", "fr-BE", "fr-CH", "fr-CA"],
  ar: ["ar-TN", "ar-SA", "ar-MA", "ar-DZ", "ar-EG", "ar-AE", "ar-JO", "ar-LB"],
};

export const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

/* ── Voix ──────────────────────────────────────────────────────────────── */

let voicesPromise = null;

// Les voix arrivent de façon asynchrone (Chrome/Edge) : on attend qu'elles soient prêtes
export function loadVoices() {
  if (!hasSpeech()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const done = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length) { window.speechSynthesis.removeEventListener?.("voiceschanged", done); resolve(v); }
      };
      window.speechSynthesis.addEventListener?.("voiceschanged", done);
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
    }).finally(() => { voicesPromise = null; });
  }
  return voicesPromise;
}

// Qualité perçue d'une voix : les voix « Natural / Online / Neural » sont bien plus claires
export function voiceQuality(voice) {
  const n = voice.name.toLowerCase();
  if (/natural|neural|online|premium|enhanced/.test(n)) return 3;
  if (/google/.test(n)) return 2;
  if (!voice.localService) return 2;
  return 1;
}

export function voicesFor(lang, voices = hasSpeech() ? window.speechSynthesis.getVoices() : []) {
  const prefix = (LANG_CONFIG[lang]?.lang || lang).split("-")[0];
  const prefs = LOCALE_PREFERENCE[lang] || [];
  const rank = (v) => {
    const i = prefs.findIndex((p) => v.lang.replace("_", "-").toLowerCase() === p.toLowerCase());
    return voiceQuality(v) * 100 - (i < 0 ? 50 : i);
  };
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith(prefix))
    .sort((a, b) => rank(b) - rank(a));
}

// Voix choisie dans les réglages, sinon la meilleure disponible
export function pickVoice(lang, preferredName) {
  const list = voicesFor(lang);
  return (preferredName && list.find((v) => v.name === preferredName)) || list[0] || null;
}

/* ── Préparation du texte ──────────────────────────────────────────────── */

const AR_LETTERS = {
  A: "إيه", B: "بي", C: "سي", D: "دي", E: "إي", F: "إف", G: "جي", H: "إتش", I: "آي",
  J: "جاي", K: "كي", L: "إل", M: "إم", N: "إن", O: "أو", P: "پي", Q: "كيو", R: "آر",
  S: "إس", T: "تي", U: "يو", V: "ڤي", W: "دبليو", X: "إكس", Y: "واي", Z: "زد",
};
const AR_DIGITS = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const FR_DIGITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

// Un groupe de chiffres : nombre naturel s'il est court, sinon chiffre par chiffre
function readDigits(group, lang) {
  if (group.length <= 3 && !(group.length > 1 && group.startsWith("0"))) return group;
  const names = lang === "ar" ? AR_DIGITS : FR_DIGITS;
  return group.split("").map((d) => names[+d]).join(lang === "ar" ? " " : " ");
}

// Préfixes de type déjà annoncés par la phrase (« السرير LIT-3 ») : inutile de les épeler
const KNOWN_PREFIXES = new Set(["CH", "CHB", "CHAMBRE", "LIT", "SAC", "LOT", "BAC", "MACH", "MACHINE"]);

// « CH-012 » → « صفر واحد اثنان » ; « AB-7 » → « إيه بي، 7 » / « A B, 7 »
function readCode(code, lang) {
  let parts = code.split(/[-_/.]+/).filter(Boolean);
  if (parts.length > 1 && KNOWN_PREFIXES.has(parts[0].toUpperCase())) parts = parts.slice(1);
  const spoken = parts.map((part) =>
    part
      .match(/[A-Za-z]+|\d+/g)
      .map((chunk) => {
        if (/^\d+$/.test(chunk)) return readDigits(chunk, lang);
        const upper = chunk.toUpperCase();
        // Mot lisible (ex. « LIT ») en français ; sinon lettre par lettre
        if (lang !== "ar" && chunk.length > 3 && /[AEIOUY]/.test(upper)) return chunk.toLowerCase();
        return upper.split("").map((l) => (lang === "ar" ? AR_LETTERS[l] || l : l)).join(" ");
      })
      .join(" ")
  );
  return spoken.join(lang === "ar" ? "، " : ", ");
}

// Jeton avec au moins une lettre latine et un chiffre (codes chambre, lit, bac, sac, lot, machine…)
const CODE_RE = /(?<![\p{L}\d])(?=[A-Za-z0-9_\-/.]*\d)(?=[A-Za-z0-9_\-/.]*[A-Za-z])[A-Za-z0-9]+(?:[-_/.][A-Za-z0-9]+)*(?![\p{L}\d])/gu;

export function prepareText(text, lang) {
  if (!text) return "";
  let out = String(text)
    .replace(CODE_RE, (code) => readCode(code, lang))
    // nombres décimaux : 12.5 → 12,5 (lu « virgule »)
    .replace(/(\d+)\.(\d+)/g, lang === "ar" ? "$1 فاصلة $2" : "$1,$2")
    .replace(/\s+/g, " ")
    .trim();
  if (lang === "ar") out = out.replace(/\?/g, "؟");
  return out;
}

// Un texte d'erreur en français (serveur) ne doit pas être lu par la voix arabe
export function isForeignForArabic(text) {
  if (!text) return false;
  const withoutCodes = String(text).replace(CODE_RE, "");
  return /[A-Za-zÀ-ÿ]{3,}/.test(withoutCodes);
}

// Découpage en phrases : pauses plus nettes et évite la coupure des longues phrases (Chrome)
export function splitSentences(text) {
  return text
    .split(/(?<=[.!?؟۔])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ── Bips ──────────────────────────────────────────────────────────────── */

// Deux notes douces par type (au lieu d'un son strident unique)
const CHIMES = {
  succes:  [{ f: 660, t: 0 }, { f: 880, t: 0.09 }],
  alerte:  [{ f: 520, t: 0 }, { f: 520, t: 0.16 }],
  erreur:  [{ f: 330, t: 0 }, { f: 247, t: 0.14 }],
  infecte: [{ f: 440, t: 0 }, { f: 349, t: 0.14 }, { f: 440, t: 0.28 }],
};

let audioCtx = null;
export function playChime(type = "succes") {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const notes = CHIMES[type] || CHIMES.succes;
    const start = audioCtx.currentTime + 0.01;
    notes.forEach(({ f, t }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type === "erreur" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, start + t);
      gain.gain.setValueAtTime(0.0001, start + t);
      gain.gain.exponentialRampToValueAtTime(0.22, start + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start + t);
      osc.stop(start + t + 0.2);
    });
    return Math.round((notes[notes.length - 1].t + 0.2) * 1000);
  } catch {
    return 0;
  }
}

/* ── Lecture ───────────────────────────────────────────────────────────── */

export function makeUtterance(sentence, lang, { rate = 1, voiceName } = {}) {
  const cfg = LANG_CONFIG[lang] || LANG_CONFIG.fr;
  const utt = new SpeechSynthesisUtterance(sentence);
  const voice = pickVoice(lang, voiceName);
  if (voice) { utt.voice = voice; utt.lang = voice.lang; } else utt.lang = cfg.lang;
  utt.rate = Math.min(1.6, Math.max(0.5, cfg.rate * (Number(rate) || 1)));
  utt.pitch = cfg.pitch;
  utt.volume = 1;
  return utt;
}

// Lecture simple (aperçu dans les Paramètres)
export async function speakOnce(text, lang, opts = {}) {
  if (!hasSpeech() || !text) return;
  await loadVoices();
  window.speechSynthesis.cancel();
  for (const s of splitSentences(prepareText(text, lang))) {
    window.speechSynthesis.speak(makeUtterance(s, lang, opts));
  }
}
