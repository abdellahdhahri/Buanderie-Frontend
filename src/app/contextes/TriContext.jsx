import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";
import { STATS_INITIALES } from "../constants/tri";

const API = "http://localhost:8082";

export const TriContext = createContext();
export const useTri = () => useContext(TriContext);

export function TriProvider({ children }) {
  const { showAlert, showConfirm } = useModal();

  const [agent,          setAgent]          = useState(null);
  const [lingeScanne,    setLingeScanne]    = useState(null);
  const [lotsSuggeres,   setLotsSuggeres]   = useState([]);
  const [lotSelectionne, setLotSelectionne] = useState(null);
  const [historiqueTri,  setHistoriqueTri]  = useState([]);
  const [statistiques,   setStatistiques]   = useState(STATS_INITIALES);
  const [loading,        setLoading]        = useState(false);
  const isMounted = useRef(true);

  // ── Agent ─────────────────────────────────────────────────────────────────
  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        setAgent(ag);
        showAlert("Agent identifié", `✅ ${ag.nom} (${ag.matricule})`, "success");
        return true;
      }
      showAlert("Agent introuvable", `❌ L'agent [${code}] n'existe pas.`, "error");
      return false;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return false;
    } finally { setLoading(false); }
  }, [showAlert]);

  const deconnecterAgent = useCallback(() => {
    setAgent(null); setLingeScanne(null);
    setLotsSuggeres([]); setLotSelectionne(null);
  }, []);

  // ── Statistiques ─────────────────────────────────────────────────────────
  const chargerStatistiques = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tri/statistiques`);
      if (res.ok) setStatistiques(await res.json());
    } catch {}
  }, []);

  // ── Lots suggérés ─────────────────────────────────────────────────────────
  const fetchLotsSuggeres = useCallback(async (codeOuTag) => {
    try {
      const res = await fetch(`${API}/api/lots/suggestion?codeOuTag=${encodeURIComponent(codeOuTag)}`);
      if (res.ok) {
        const lots = await res.json();
        setLotsSuggeres(Array.isArray(lots) ? lots : []);
        return lots;
      }
      return [];
    } catch { return []; }
  }, []);

  // ── Scan linge ────────────────────────────────────────────────────────────
  const scanLinge = useCallback(async (code, getLingeByCode) => {
    setLoading(true);
    try {
      const linge = await getLingeByCode(code);
      if (!linge) { showAlert("Introuvable", `❌ Code [${code}] inconnu.`, "error"); return null; }

      const etatsValides = ["RECEPTION", "EN_TRI", "PROPRE", "A_TRIER"];
      if (!etatsValides.includes(linge.etat)) {
        showAlert("État invalide", `⚠️ Linge [${code}] est en état [${linge.etat}].`, "warning");
        return null;
      }

      setLingeScanne(linge);
      const lots = await fetchLotsSuggeres(code);
      if (!lots.length) showAlert("Aucun lot", "Aucun lot disponible pour ce linge.", "info");
      return linge;
    } catch {
      showAlert("Erreur réseau", "", "error");
      return null;
    } finally { setLoading(false); }
  }, [showAlert, fetchLotsSuggeres]);

  // ── Affecter au lot ───────────────────────────────────────────────────────
  const affecterAuLot = useCallback(async (lotId) => {
    if (!lingeScanne || !agent) return;
    const codeOuTag = lingeScanne.rfidTag || lingeScanne.codeBarre;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeOuTag, matriculeAgent: agent.matricule, lotId })
      });
      if (!res.ok) {
        const err = await res.text();
        let msg = err; try { msg = JSON.parse(err).message || err; } catch {}
        throw new Error(msg);
      }
      const lot = await res.json();
      const entree = {
        id:        Date.now(),
        code:      codeOuTag,
        categorie: lingeScanne.categorie,
        lot:       lot.codeLot || lotId,
        heure:     new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistoriqueTri(prev => [entree, ...prev.slice(0, 49)]);
      setStatistiques(prev => ({ totalTrie: prev.totalTrie + 1, lotsUtilises: prev.lotsUtilises, poidsTotal: prev.poidsTotal + (lingeScanne.poidsKg || 0) }));
      setLingeScanne(null); setLotsSuggeres([]); setLotSelectionne(null);
      showAlert("✅ Trié", `${codeOuTag} → lot ${lot.codeLot || lotId}`, "success");
      return true;
    } catch (err) {
      showAlert("Erreur affectation", err.message, "error");
      return false;
    } finally { setLoading(false); }
  }, [lingeScanne, agent, showAlert]);

  const annuler = useCallback(() => {
    setLingeScanne(null); setLotsSuggeres([]); setLotSelectionne(null);
  }, []);

  return (
    <TriContext.Provider value={{
      agent, lingeScanne, lotsSuggeres, lotSelectionne,
      historiqueTri, statistiques, loading,
      scanAgent, deconnecterAgent, chargerStatistiques,
      scanLinge, fetchLotsSuggeres, affecterAuLot,
      setLotSelectionne, annuler,
    }}>
      {children}
    </TriContext.Provider>
  );
}
