import { useState, useRef, useCallback } from "react";
import { VOIX_MAP, NOMBRES_FR } from "../constants/collecte";

// ─── Parser voix → items infectés ────────────────────────────────────────────
export function parserVoixInfecte(texte) {
  const t = texte.toLowerCase().trim();
  const resultats = [];

  if (VOIX_MAP.find(v => v.cat === "ANNULE")?.mots.some(m => t.includes(m))) {
    return [{ cat: "ANNULE" }];
  }

  const tokens = t.split(/\s+et\s+|\s*,\s*/);
  for (const token of tokens) {
    let quantite = 1;
    let categorieId = null;

    const matchChiffre = token.match(/(\d+)/);
    if (matchChiffre) {
      quantite = parseInt(matchChiffre[1]);
    } else {
      for (const [mot, val] of Object.entries(NOMBRES_FR)) {
        if (token.includes(mot)) { quantite = val; break; }
      }
    }

    for (const { mots, cat } of VOIX_MAP) {
      if (cat === "ANNULE") continue;
      if (mots.some(m => token.includes(m))) { categorieId = cat; break; }
    }

    if (categorieId) resultats.push({ cat: categorieId, qty: quantite });
  }

  return resultats;
}

// ─── Hook saisie vocale ───────────────────────────────────────────────────────
export function useSaisieVocale(onResultat) {
  const [actif,      setActif]      = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const demarrer = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec          = new SpeechRecognition();
    rec.lang           = "fr-FR";
    rec.continuous     = false;
    rec.interimResults = true;

    rec.onstart  = () => setActif(true);
    rec.onend    = () => setActif(false);
    rec.onerror  = () => setActif(false);

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0].isFinal) {
        onResultat(t);
        setTranscript("");
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onResultat]);

  const arreter = useCallback(() => {
    recognitionRef.current?.stop();
    setActif(false);
  }, []);

  return { actif, transcript, demarrer, arreter };
}
