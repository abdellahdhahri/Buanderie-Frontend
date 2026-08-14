import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";
import Swal from "sweetalert2";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const ReceptionContext = createContext();
export const useReception = () => useContext(ReceptionContext);

export function ReceptionProvider({ children }) {
  const { showAlert } = useModal();

  const [agent,        setAgent]        = useState(null);
  const [dernierRecu,  setDernierRecu]  = useState(null);
  const [bacEnCours,   setBacEnCours]   = useState(null);
  const [lingesAffichés, setLingesAffichés] = useState([]);
  const [afficherLinges, setAfficherLinges] = useState(false);
  const [loadingLinges,  setLoadingLinges]  = useState(false);
  const [rfidResultat, setRfidResultat] = useState(null);
  const [loading,      setLoading]      = useState(false);

  const isMounted = useRef(true);

  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/matricule/${code}`);
      if (res.ok) {
        const ag = await res.json();
        if (isMounted.current) setAgent(ag);
        Swal.fire({ title: "Agent identifié", text: `${ag.nom} (${ag.matricule})`, icon: "success", timer: 1200, showConfirmButton: false });
        return true;
      }
      Swal.fire({ title: "Agent introuvable", text: `[${code}]`, icon: "error" });
      return false;
    } catch {
      Swal.fire({ title: "Erreur réseau", icon: "error" });
      return false;
    } finally { if (isMounted.current) setLoading(false); }
  }, []);

  const deconnecterAgent = useCallback(() => setAgent(null), []);

  const fetchLingesDuBac = useCallback(async (bacId) => {
    if (!bacId) return [];
    setLoadingLinges(true); setAfficherLinges(false);
    try {
      const res = await fetch(`${API_URL}/api/bacs/bacs/${bacId}/linges`);
      if (res.ok) {
        const data = await res.json();
        const linges = Array.isArray(data) ? data : data.content || [];
        if (isMounted.current) { setLingesAffichés(linges); setAfficherLinges(true); }
        return linges;
      }
      return [];
    } catch { return []; }
    finally { if (isMounted.current) setLoadingLinges(false); }
  }, []);

  const fermerLinges = useCallback(() => {
    setAfficherLinges(false); setLingesAffichés([]); setBacEnCours(null);
  }, []);

  const getBacByCode = useCallback(async (codeBac) => {
    try {
      const res = await fetch(`${API_URL}/api/bacs/code/${codeBac}`);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }, []);

  const scanReception = useCallback(async (code) => {
    if (!agent) { showAlert("Agent requis", "Scannez votre badge d'abord.", "warning"); return; }
    setLoading(true);
    try {
      const codeUpper  = code.toUpperCase().trim();
      const estInfecte = codeUpper.startsWith("SAC");

      if (!estInfecte) {

        const bac = await getBacByCode(codeUpper);
        if (!bac) { Swal.fire({ title: "Bac introuvable", text: `[${codeUpper}]`, icon: "error" }); return; }

        const res = await fetch(`${API_URL}/api/reception?matricule=${agent.matricule}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codesBac: [codeUpper], numerosSacsInfectes: [] })
        });
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(msg);
        }
        const data    = await res.json();
        const bacRecu = data.bacsRecus?.[0];
        if (bacRecu && isMounted.current) {
          setDernierRecu({ type: "BAC", code: codeUpper, data: bacRecu });
          setBacEnCours({ id: bac.id, code: codeUpper });
          const linges = await fetchLingesDuBac(bac.id);
          Swal.fire({ title: "✅ Bac reçu", html: `<b>${codeUpper}</b><br/>${linges.length} linge(s)`, icon: "success", timer: 1500, showConfirmButton: false });
        }
      } else {



        const res = await fetch(`${API_URL}/api/sacs-infectes/recevoir?numeroSac=${codeUpper}&matricule=${agent.matricule}`, { method: "PUT" });
        if (!res.ok) {
          const txt = await res.text();
          let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
          throw new Error(msg);
        }
        const sac = await res.json();
        if (isMounted.current) {
          setDernierRecu({ type: "SAC_INFECTE", code: codeUpper, data: sac });
          let details = `<b>${codeUpper}</b><br/>`;
          if (sac.quantiteDeclaree) details += `${sac.quantiteDeclaree} articles`;
          if (sac.agentCollecteNom) details += ` • ${sac.agentCollecteNom}`;
          Swal.fire({ title: "🔴 Sac infecté reçu", html: details, icon: "warning", timer: 2500, showConfirmButton: false });
        }
      }
    } catch (err) {
      Swal.fire({ title: "Erreur", text: err.message, icon: "error" });
    } finally { if (isMounted.current) setLoading(false); }
  }, [agent, getBacByCode, fetchLingesDuBac]);



  const passagePortique = useCallback(async (codeBac, tags) => {
    if (!agent) { Swal.fire({ title: "Agent requis", icon: "warning" }); return; }
    if (!codeBac) { Swal.fire({ title: "Code bac manquant", icon: "warning" }); return; }
    if (!tags?.length) { Swal.fire({ title: "Tags manquants", icon: "warning" }); return; }

    setLoading(true);
    try {
      const bac = await getBacByCode(codeBac);
      if (!bac) { Swal.fire({ title: "Bac introuvable", text: codeBac, icon: "error" }); return; }

      const res = await fetch(`${API_URL}/api/reception/receptionRfid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matriculeAgent: agent.matricule, codeBac, rfidTags: tags })
      });
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt; try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      const resultat = await res.json();

      // Normaliser typeBac (enlever accents, majuscules)
      const typeBacNorm = (resultat.typeBac || "")
        .toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const estInfecte = typeBacNorm === "INFECTE";
      const r = { ...resultat, typeBac: estInfecte ? "INFECTE" : "BLANC" };

      if (isMounted.current) { setRfidResultat(r); }

      if (estInfecte) {
        await Swal.fire({
          title: "🔴 BAC INFECTÉ DÉTECTÉ",
          html: `<div style="text-align:left;padding:8px"><p style="color:#dc2626;font-weight:600">⚠️ Ce bac contient du linge infecté !</p><div style="background:#fee2e2;padding:10px;border-radius:8px;margin-bottom:10px"><b>Bac :</b> ${codeBac}<br/><b>Linges :</b> ${r.lingesTraites?.length || 0}<br/><b>Type :</b> INFECTÉ</div><p style="font-size:13px;color:#64748b">🚨 Ce bac doit être orienté vers le <strong>circuit infecté</strong>.</p></div>`,
          icon: "warning", iconColor: "#dc2626",
          confirmButtonText: "✅ Compris — Circuit infecté",
          confirmButtonColor: "#dc2626", allowOutsideClick: false,
        });
      } else {
        Swal.fire({ title: "✅ Bac BLANC reçu", html: `Bac <b>${codeBac}</b><br/><b>${r.lingesTraites?.length || 0}</b> linge(s)<br/><span style="color:#22c55e">→ Orienter vers le TRI</span>`, icon: "success", timer: 2500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ title: "Erreur RFID", text: err.message, icon: "error" });
    } finally { if (isMounted.current) setLoading(false); }
  }, [agent, getBacByCode]);

  const resetRfid = useCallback(() => { setRfidResultat(null); }, []);

  const reset = useCallback(() => {
    setAgent(null); setDernierRecu(null); setBacEnCours(null);
    setLingesAffichés([]); setAfficherLinges(false); setRfidResultat(null);
  }, []);

  return (
    <ReceptionContext.Provider value={{
      agent, dernierRecu, bacEnCours,
      lingesAffichés, afficherLinges, loadingLinges,
      rfidResultat, loading,
      scanAgent, deconnecterAgent,
      fetchLingesDuBac, fermerLinges,
      scanReception, passagePortique, resetRfid, reset,
    }}>
      {children}
    </ReceptionContext.Provider>
  );
}