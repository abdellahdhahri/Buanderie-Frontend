import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, Truck, PackageCheck, ListFilter, WashingMachine, Wind, Layers, Warehouse, Send, Circle } from "lucide-react";
import { useAuth } from "../../../constants/AuthContext";
import ScanInput from "../../utils/ScanInput";
import {
  chargerParcours, chercherEtapeParCode, codeEtape, estActive, idsSuivantes, nomEtape, routeEtape,
} from "../../../services/processusService";
import "./Processus.css";

const LARGEUR = 260;
const HAUTEUR = 58;
const ECART = 30;
const COLONNES = 100;
const MARGE = 70;
const COULEUR_FLECHE = "#a855f7";

const ICONES_ETAPES = {
  COLLECTE: Truck,
  RECEPTION: PackageCheck,
  TRI: ListFilter,
  LAVAGE: WashingMachine,
  SECHAGE: Wind,
  PLIAGE: Layers,
  STOCKAGE: Warehouse,
  DISTRIBUTION: Send,
};

function disposer(etapes) {
  const moitie = Math.ceil(etapes.length / 2);
  const droite = etapes.slice(0, moitie);
  const gauche = etapes.slice(moitie);
  const lignes = Math.max(droite.length, gauche.length, 1);
  const pos = new Map();
  droite.forEach((e, i) => pos.set(e.id, { x: LARGEUR + COLONNES, y: MARGE + i * (HAUTEUR + ECART), col: "droite", ligne: i }));
  gauche.forEach((e, j) => {
    const ligne = gauche.length - 1 - j;
    pos.set(e.id, { x: 0, y: MARGE + ligne * (HAUTEUR + ECART), col: "gauche", ligne });
  });
  return { pos, lignes, droite, gauche };
}

function liens(etapes) {
  const res = [];
  etapes.forEach((e, i) => {
    const suivantes = idsSuivantes(e);
    const cibles = suivantes.length ? suivantes : etapes[i + 1] ? [etapes[i + 1].id] : [];
    cibles.forEach((id) => { if (etapes.some((x) => x.id === id)) res.push([e.id, id]); });
  });
  return res;
}

function tracer(a, b, lignes) {
  const cx = (p) => p.x + LARGEUR / 2;
  const bas = MARGE + lignes * HAUTEUR + (lignes - 1) * ECART;
  if (a.col === b.col) {
    if (Math.abs(a.ligne - b.ligne) === 1) {
      const versHaut = b.y < a.y;
      return versHaut
        ? `M ${cx(a)} ${a.y} L ${cx(b)} ${b.y + HAUTEUR + 2}`
        : `M ${cx(a)} ${a.y + HAUTEUR} L ${cx(b)} ${b.y - 2}`;
    }
    const cote = a.col === "gauche" ? a.x - 36 : a.x + LARGEUR + 36;
    const sx = a.col === "gauche" ? a.x : a.x + LARGEUR;
    return `M ${sx} ${a.y + HAUTEUR / 2} L ${cote} ${a.y + HAUTEUR / 2} L ${cote} ${b.y + HAUTEUR / 2} L ${sx + (a.col === "gauche" ? -2 : 2)} ${b.y + HAUTEUR / 2}`;
  }
  if (a.col === "gauche") {
    const haut = MARGE / 2;
    return `M ${cx(a)} ${a.y} L ${cx(a)} ${haut + 12} Q ${cx(a)} ${haut} ${cx(a) + 14} ${haut} L ${cx(b) - 14} ${haut} Q ${cx(b)} ${haut} ${cx(b)} ${haut + 12} L ${cx(b)} ${b.y - 2}`;
  }
  const bord = bas + MARGE / 2;
  return `M ${cx(a)} ${a.y + HAUTEUR} L ${cx(a)} ${bord - 12} Q ${cx(a)} ${bord} ${cx(a) - 14} ${bord} L ${cx(b) + 14} ${bord} Q ${cx(b)} ${bord} ${cx(b)} ${bord - 12} L ${cx(b)} ${b.y + HAUTEUR + 2}`;
}

export default function Processus() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth, admin, hasPrivilege } = useAuth();
  const [etapes, setEtapes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [code, setCode] = useState("");
  const [statut, setStatut] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let vivant = true;
    chargerParcours()
      .then((l) => { if (vivant) setEtapes(l); })
      .catch((e) => { if (vivant) setErreur(e.message); })
      .finally(() => { if (vivant) setChargement(false); });
    return () => { vivant = false; };
  }, []);

  const autorisee = useCallback((e) => !e.privilegeRequis || hasPrivilege(e.privilegeRequis), [hasPrivilege]);

  const avertirHabilitation = useCallback((e) => {
    const liste = auth?.etapes;
    if (admin || !Array.isArray(liste) || liste.length === 0) return;
    if (!liste.some((x) => x.id === e.id)) {
      toast.warning(`Vous n'êtes pas habilité pour l'étape ${nomEtape(e)}`);
    }
  }, [auth, admin]);

  const aller = useCallback((e) => {
    const route = routeEtape(e);
    if (!route) {
      setStatut({ type: "erreur", texte: t("processus.no_route", "Aucun écran associé à l'étape {{nom}}", { nom: nomEtape(e) }) });
      return;
    }
    avertirHabilitation(e);
    navigate(route);
  }, [navigate, avertirHabilitation, t]);

  const scanner = async (valeur) => {
    const saisi = valeur.trim();
    setCode("");
    if (!saisi || busy) return;
    setBusy(true);
    setStatut(null);
    try {
      const res = await chercherEtapeParCode(saisi);
      if (res.erreur) { setStatut({ type: "erreur", texte: res.erreur }); return; }
      if (res.inconnu) { setStatut({ type: "erreur", texte: t("processus.unknown_code", "Code d'étape inconnu") }); return; }
      const etape = res.etape;
      if (!estActive(etape)) { setStatut({ type: "warn", texte: t("processus.inactive", "Cette étape est désactivée") }); return; }
      if (!autorisee(etape)) {
        setStatut({ type: "erreur", texte: `Vous n'avez pas le privilège pour l'étape ${nomEtape(etape)}` });
        return;
      }
      setStatut({ type: "ok", texte: nomEtape(etape) });
      aller(etape);
    } catch (e) {
      setStatut({ type: "erreur", texte: e.message || t("processus.unknown_code", "Code d'étape inconnu") });
    } finally {
      setBusy(false);
    }
  };

  const { pos, lignes, droite, gauche } = useMemo(() => disposer(etapes), [etapes]);
  const aretes = useMemo(() => liens(etapes), [etapes]);

  const largeur = LARGEUR * 2 + COLONNES;
  const hauteurBoites = lignes * HAUTEUR + (lignes - 1) * ECART;
  const hauteur = MARGE * 2 + hauteurBoites;
  const centreG = LARGEUR / 2;
  const centreD = LARGEUR + COLONNES + LARGEUR / 2;

  const bouton = (e) => {
    const p = pos.get(e.id);
    const active = estActive(e);
    const permis = autorisee(e);
    const clic = active && permis;
    const sale = droite.some((x) => x.id === e.id);
    const Icone = ICONES_ETAPES[codeEtape(e)] || Circle;
    const info = !active ? t("processus.inactive", "Cette étape est désactivée") : !permis ? t("processus.missing_privilege", "Privilège manquant") : undefined;
    return (
      <button
        key={e.id}
        type="button"
        className={`prc-step ${sale ? "is-sale" : "is-propre"} ${clic ? "" : "is-locked"} ${active ? "" : "is-inactive"}`}
        style={{ left: p.x, top: p.y, width: LARGEUR, height: HAUTEUR }}
        title={info}
        aria-disabled={!clic}
        onClick={() => { if (clic) aller(e); }}
      >
        <span className="prc-step__icon" aria-hidden="true"><Icone size={18} /></span>
        <span className="prc-step__label">{nomEtape(e)}</span>
        {e.ordre != null && <span className="prc-step__num">{e.ordre}</span>}
      </button>
    );
  };

  return (
    <div className="prc">
      <div className="prc-scan">
        <ScanInput
          placeholder={t("processus.scan_placeholder", "Scannez le code de l'étape")}
          value={code}
          onChange={setCode}
          onSubmit={scanner}
          borderColor="#0794a4"
          sansIndicateur
        />
        <div className={`prc-scan__status ${statut ? `is-${statut.type}` : ""}`} role="status" aria-live="polite">
          {statut && (statut.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />)}
          {statut?.texte}
        </div>
      </div>

      {chargement ? (
        <div className="prc-msg"><Loader2 size={20} className="animate-spin" /> {t("common.loading", "Chargement…")}</div>
      ) : erreur ? (
        <div className="prc-msg is-error" role="alert"><AlertCircle size={18} /> {erreur}</div>
      ) : etapes.length === 0 ? (
        <div className="prc-msg">{t("common.no_data", "Aucune donnée")}</div>
      ) : (
        <div className="prc-board" style={{ width: largeur, height: hauteur }}>
          <div
            className="prc-zone"
            style={{ left: centreG, top: MARGE / 2, width: centreD - centreG, height: hauteurBoites + MARGE }}
          >
            <span>{t("buanderie.title", "Buanderie")}</span>
          </div>
          <svg className="prc-links" width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} aria-hidden="true">
            <defs>
              <marker id="prc-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={COULEUR_FLECHE} />
              </marker>
            </defs>
            {aretes.map(([de, vers]) => {
              const a = pos.get(de);
              const b = pos.get(vers);
              if (!a || !b) return null;
              return <path key={`${de}-${vers}`} d={tracer(a, b, lignes)} className="prc-flow" stroke={COULEUR_FLECHE} strokeWidth="2.5" fill="none" strokeLinecap="round" markerEnd="url(#prc-pointe)" />;
            })}
          </svg>
          {[...gauche, ...droite].map(bouton)}
        </div>
      )}

      <div className="prc-legend">
        <span><i className="is-sale" /> {t("buanderie.circuit_sale", "Circuit sale")}</span>
        <span><i className="is-propre" /> {t("buanderie.circuit_propre", "Circuit propre")}</span>
      </div>
    </div>
  );
}
