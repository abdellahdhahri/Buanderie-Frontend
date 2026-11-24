import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Clock, Maximize2, Minimize2, Pause, Play, Radio, Rewind, Shirt, User,
} from "lucide-react";
import {
  CARTE, ETAT_COULEURS, ETAT_TO_STATION, LONGUEUR_TOTALE, STATIONS, STATION_PAR_ID, TRACE, pointA,
} from "./stations";

const VITESSES = [1, 2, 4];

const enPct = (p) => ({ left: `${(p.x / CARTE.largeur) * 100}%`, top: `${(p.y / CARTE.hauteur) * 100}%` });

const mouvementReduit = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

function useLongueurAnimee(cible) {
  const [longueur, setLongueur] = useState(cible ?? 0);
  const courant = useRef(cible ?? 0);
  useEffect(() => {
    if (cible == null) return undefined;
    const depart = courant.current;
    const debut = performance.now();
    const duree = mouvementReduit() ? 0 : Math.min(2600, 700 + Math.abs(cible - depart) * 1.2);
    let id;
    const pas = (now) => {
      const p = duree === 0 ? 1 : Math.min(1, (now - debut) / duree);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const v = depart + (cible - depart) * e;
      courant.current = v;
      setLongueur(v);
      if (p < 1) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [cible]);
  return longueur;
}

function useMaintenant(intervalle = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalle);
    return () => clearInterval(id);
  }, [intervalle]);
  return now;
}

const depuis = (ms, t) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return t("tracking.ago_s", "il y a {{n}} s", { n: s });
  return t("tracking.ago_min", "il y a {{n}} min", { n: Math.round(s / 60) });
};

export default function LiveBoard({
  item, history, lang, t, libelleOperation, formatDateTime, infos, live, majA, loading, onDetails,
  EtatPill, ScanIcon, emptyTitle, emptyText,
}) {
  const cadreRef = useRef(null);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [relecture, setRelecture] = useState(null);
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const [survol, setSurvol] = useState(null);
  const now = useMaintenant();

  const evenements = useMemo(() => history
    .map((h, i) => ({ ...h, cle: h.id ?? `${h.dateOperation}-${i}`, station: ETAT_TO_STATION[h.etatapres || h.etat] }))
    .filter((e) => e.station), [history]);

  const stationActuelle = item ? ETAT_TO_STATION[item.etat] : null;
  const evenement = relecture != null ? evenements[relecture] : evenements[evenements.length - 1];
  const stationCible = relecture != null ? evenement?.station : stationActuelle;
  const cible = stationCible ? STATION_PAR_ID[stationCible].l : item ? null : 0;
  const longueur = useLongueurAnimee(cible);
  const enMouvement = cible != null && Math.abs(longueur - cible) > 2;
  const position = pointA(longueur);

  const stats = useMemo(() => {
    const r = {};
    evenements.forEach((e) => {
      const s = (r[e.station] = r[e.station] || { n: 0, premier: null, dernier: null });
      s.n += 1;
      if (!s.premier) s.premier = e.dateOperation;
      s.dernier = e.dateOperation;
    });
    return r;
  }, [evenements]);

  const [vus, setVus] = useState(null);
  const nouveaux = useMemo(() => {
    const n = new Set();
    if (vus) evenements.forEach((e) => { if (!vus.has(e.cle)) n.add(e.cle); });
    return n;
  }, [evenements, vus]);
  useEffect(() => {
    const id = setTimeout(() => setVus(new Set(evenements.map((e) => e.cle))), 2500);
    return () => clearTimeout(id);
  }, [evenements]);

  useEffect(() => {
    if (!lecture || relecture == null) return undefined;
    if (relecture >= evenements.length - 1) {
      const fin = setTimeout(() => setLecture(false), 400);
      return () => clearTimeout(fin);
    }
    const id = setTimeout(() => setRelecture((i) => i + 1), 1900 / vitesse);
    return () => clearTimeout(id);
  }, [lecture, relecture, vitesse, evenements.length]);

  useEffect(() => {
    const maj = () => setPleinEcran(document.fullscreenElement === cadreRef.current);
    document.addEventListener("fullscreenchange", maj);
    return () => document.removeEventListener("fullscreenchange", maj);
  }, []);

  const basculerPleinEcran = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else cadreRef.current?.requestFullscreen?.();
  };

  const lancer = () => {
    if (!evenements.length) return;
    if (relecture == null || relecture >= evenements.length - 1) setRelecture(0);
    setLecture(true);
  };
  const retourDirect = () => { setLecture(false); setRelecture(null); };
  const aller = (i) => { setLecture(false); setRelecture(i); };

  const indexActuel = stationCible ? STATIONS.findIndex((s) => s.id === stationCible) : -1;
  const manquant = item?.etat === "MANQUANT" && relecture == null;

  return (
    <section ref={cadreRef} className={`trk-live ${pleinEcran ? "is-fs" : ""}`} aria-label={t("tracking.live_view", "Suivi en temps réel")}>
      <header className="trk-live__bar">
        <div className="trk-live__id">
          <span className="trk-live__icon"><Shirt size={20} /></span>
          <div>
            <strong>{item?.codeBarre || t("tracking.no_item", "Aucun linge")}</strong>
            <small>{item ? `${item.categorie || "—"} · #${item.id}` : t("tracking.waiting", "En attente")}</small>
          </div>
          {item && <EtatPill etat={item.etat} t={t} />}
        </div>
        <div className="trk-live__status">
          <span className={`trk-live__dot ${live ? "is-on" : ""}`} aria-hidden="true" />
          <span>
            <strong>{relecture != null ? t("tracking.replay", "Relecture") : live ? "LIVE" : "OFF"}</strong>
            <small>{loading ? t("tracking.searching") : majA ? `${t("tracking.updated", "Mis à jour")} ${depuis(now - majA, t)}` : "—"}</small>
          </span>
        </div>
        <div className="trk-live__tools">
          {item && <button type="button" className="trk-btn" onClick={onDetails}>{t("common.details", "Détails")}</button>}
          <button type="button" className="trk-btn trk-btn--icon" onClick={basculerPleinEcran} aria-label={pleinEcran ? t("tracking.exit_fullscreen", "Quitter le plein écran") : t("tracking.fullscreen", "Plein écran")} title={pleinEcran ? t("tracking.exit_fullscreen", "Quitter le plein écran") : t("tracking.fullscreen", "Plein écran")}>
            {pleinEcran ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <div className="trk-live__main">
        <div className="trk-map">
          <div className="trk-map__stage">
            <svg className="trk-map__svg" viewBox={`0 0 ${CARTE.largeur} ${CARTE.hauteur}`} aria-hidden="true">
              <defs>
                <pattern id="trk-grille" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#cbd5e1" opacity="0.5" />
                </pattern>
                <mask id="trk-masque" maskUnits="userSpaceOnUse" x="0" y="0" width={CARTE.largeur} height={CARTE.hauteur}>
                  <path d={TRACE} fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" style={{ strokeDasharray: `${longueur} ${LONGUEUR_TOTALE + 50}` }} />
                </mask>
              </defs>
              <rect width={CARTE.largeur} height={CARTE.hauteur} fill="url(#trk-grille)" />
              <rect x="30" y="34" width="940" height="152" rx="18" className="trk-band is-sale" />
              <rect x="30" y="234" width="940" height="152" rx="18" className="trk-band is-propre" />
              <path d={TRACE} className="trk-track" />
              <path d={TRACE} className="trk-track__done" style={{ strokeDasharray: `${longueur} ${LONGUEUR_TOTALE + 50}` }} />
              {item && <path d={TRACE} className={`trk-track__flow ${live && relecture == null ? "is-live" : ""}`} mask="url(#trk-masque)" />}
            </svg>

            <span className="trk-zone-tag is-sale">{t("tracking.zone_sale", "Zone sale")}</span>
            <span className="trk-zone-tag is-propre">{t("tracking.zone_propre", "Zone propre")}</span>

            {STATIONS.map((s, i) => {
              const Icon = s.Icon;
              const etat = manquant ? "" : i < indexActuel ? "is-done" : i === indexActuel ? "is-current" : "";
              const st = stats[s.id];
              const ouvert = survol === s.id;
              const bas = s.l > STATIONS[3].l;
              return (
                <div key={s.id} className={`trk-node ${etat} ${bas ? "is-bas" : ""}`} style={enPct(pointA(s.l))}>
                  <button
                    type="button"
                    className="trk-node__dot"
                    onMouseEnter={() => setSurvol(s.id)}
                    onMouseLeave={() => setSurvol(null)}
                    onFocus={() => setSurvol(s.id)}
                    onBlur={() => setSurvol(null)}
                    onClick={() => {
                      const idx = evenements.map((e) => e.station).lastIndexOf(s.id);
                      if (idx >= 0) aller(idx);
                    }}
                    aria-label={`${s.label[lang] || s.label.fr}${st ? ` · ${st.n} ${t("tracking.passages", "passage(s)")}` : ""}`}
                  >
                    <Icon size={22} />
                  </button>
                  <span className="trk-node__label">{s.label[lang] || s.label.fr}</span>
                  {ouvert && (
                    <div className="trk-node__tip" role="tooltip">
                      <strong>{s.label[lang] || s.label.fr}</strong>
                      {st ? (
                        <>
                          <span>{st.n} {t("tracking.passages", "passage(s)")}</span>
                          <span>{t("tracking.first", "Premier")} : {formatDateTime(st.premier) || "—"}</span>
                          {st.n > 1 && <span>{t("tracking.last", "Dernier")} : {formatDateTime(st.dernier) || "—"}</span>}
                        </>
                      ) : <span>{t("tracking.no_passage", "Aucun passage enregistré")}</span>}
                    </div>
                  )}
                </div>
              );
            })}

            {item && cible != null && (
              <div className={`trk-puck ${enMouvement ? "is-moving" : ""}`} style={enPct(position)}>
                <span className="trk-puck__ring" aria-hidden="true" />
                <span className="trk-puck__core"><Shirt size={18} /></span>
              </div>
            )}

            {item && evenement && (
              <div className={`trk-callout ${enMouvement ? "is-moving" : ""}`} aria-live="polite">
                <small>{relecture != null ? t("tracking.replay", "Relecture") : t("tracking.last_operation", "Dernière opération")}</small>
                <strong>{evenement.typeOperation ? libelleOperation(evenement.typeOperation, t(`historique.type.${evenement.typeOperation}`, evenement.typeOperation)) : t(`tracking.etat.${evenement.etatapres || evenement.etat}`, evenement.etatapres || evenement.etat)}</strong>
                <span><Clock size={12} /> {formatDateTime(evenement.dateOperation) || "—"}</span>
                {evenement.agentNom && <span><User size={12} /> {evenement.agentNom}</span>}
              </div>
            )}

            {manquant && (
              <div className="trk-map__alert" role="status"><AlertTriangle size={18} /> {t("tracking.etat.MANQUANT", "Manquant")}</div>
            )}

            {!item && (
              <div className="trk-map__empty">
                <span><ScanIcon size={26} /></span>
                <strong>{emptyTitle}</strong>
                <small>{emptyText}</small>
              </div>
            )}
          </div>
        </div>

        <aside className="trk-side">
          {item && infos?.length > 0 && (
            <section className="trk-side__bloc">
              <h4>{t("tracking.information", "Informations du linge")}</h4>
              <dl className="trk-side__infos">
                {infos.map((i) => <div key={i.label}><dt>{i.label}</dt><dd>{i.value ?? "—"}</dd></div>)}
              </dl>
              <div className="trk-side__obs">
                <span>{t("tracking.observations", "Observations")}</span>
                <p className={item.observations ? "" : "is-empty"}>{item.observations || t("tracking.no_observation", "Aucune observation")}</p>
              </div>
            </section>
          )}
          <section className="trk-side__bloc trk-side__bloc--feed">
            <h4><Radio size={14} /> {t("tracking.live_feed", "Fil en direct")} <span className="trk-count">{evenements.length}</span></h4>
            {evenements.length === 0 ? (
              <p className="trk-side__vide">{t("tracking.no_history", "Aucun historique")}</p>
            ) : (
              <ol className="trk-feed">
                {[...evenements].reverse().map((e) => {
                  const idx = evenements.indexOf(e);
                  const actif = relecture != null ? idx === relecture : idx === evenements.length - 1;
                  const etat = e.etatapres || e.etat;
                  return (
                    <li key={e.cle} className={`${nouveaux.has(e.cle) ? "is-new" : ""} ${actif ? "is-active" : ""}`} style={{ "--c": ETAT_COULEURS[etat] || "#64748b" }}>
                      <button type="button" onClick={() => aller(idx)}>
                        <i aria-hidden="true" />
                        <span>
                          <strong>{e.typeOperation ? libelleOperation(e.typeOperation, t(`historique.type.${e.typeOperation}`, e.typeOperation)) : t(`tracking.etat.${etat}`, etat)}</strong>
                          <small>{STATION_PAR_ID[e.station]?.label[lang] || e.station} · {formatDateTime(e.dateOperation) || "—"}</small>
                          {e.agentNom && <small>{e.agentNom}</small>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <footer className="trk-replay">
        <div className="trk-replay__ctrl">
          {lecture ? (
            <button type="button" className="trk-btn trk-btn--primary" onClick={() => setLecture(false)} disabled={!evenements.length}>
              <Pause size={16} /> {t("tracking.pause", "Pause")}
            </button>
          ) : (
            <button type="button" className="trk-btn trk-btn--primary" onClick={lancer} disabled={!evenements.length}>
              <Play size={16} /> {t("tracking.replay_route", "Rejouer le parcours")}
            </button>
          )}
          <button type="button" className="trk-btn" onClick={retourDirect} disabled={relecture == null}>
            <Rewind size={16} /> {t("tracking.back_live", "Retour au direct")}
          </button>
          <div className="trk-speed" role="radiogroup" aria-label={t("tracking.speed", "Vitesse")}>
            {VITESSES.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={vitesse === v} className={vitesse === v ? "is-active" : ""} onClick={() => setVitesse(v)}>×{v}</button>
            ))}
          </div>
        </div>
        <div className="trk-scrub">
          <input
            type="range"
            min={0}
            max={Math.max(0, evenements.length - 1)}
            value={relecture ?? Math.max(0, evenements.length - 1)}
            onChange={(e) => aller(Number(e.target.value))}
            disabled={evenements.length < 2}
            aria-label={t("tracking.timeline", "Chronologie")}
            style={{ "--p": `${evenements.length > 1 ? ((relecture ?? evenements.length - 1) / (evenements.length - 1)) * 100 : 0}%` }}
          />
          <span className="trk-scrub__info">
            {evenements.length ? `${(relecture ?? evenements.length - 1) + 1} / ${evenements.length}` : "0 / 0"}
          </span>
        </div>
      </footer>
    </section>
  );
}
