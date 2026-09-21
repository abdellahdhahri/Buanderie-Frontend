import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useModal } from "./ModalContext";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export const ReceptionContext = createContext();
export const useReception = () => useContext(ReceptionContext);

export function ReceptionProvider({ children }) {
  const { showAlert } = useModal();

  const [agent, setAgent] = useState(null);
  const [dernierRecu, setDernierRecu] = useState(null);
  const [bacEnCours, setBacEnCours] = useState(null);
  const [lingesAffichés, setLingesAffichés] = useState([]);
  const [afficherLinges, setAfficherLinges] = useState(false);
  const [loadingLinges, setLoadingLinges] = useState(false);
  const [rfidResultat, setRfidResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bacsRecus, setBacsRecus] = useState([]);
  const [sacsInfectes, setSacsInfectes] = useState([]);

  const isMounted = useRef(true);

  const scanAgent = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sqlserver/personnel/code?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const personnel = await res.json();
        const ag = {
          matricule: personnel.codeBarre || code,
          nom: personnel.nom || "Inconnu",
          prenom: personnel.prenom || "",
          nomPrenom: personnel.nomPrenom || personnel.nom || "Inconnu",
          codeBarre: personnel.codeBarre || code,
          id: personnel.id,
          poste: personnel.fonction || "AGENT_RECEPTION"
        };
        if (isMounted.current) setAgent(ag);
        Swal.fire({ 
          title: "Agent identifié", 
          text: `${ag.nomPrenom || ag.nom} (${ag.codeBarre || ag.matricule})`, 
          icon: "success", 
          timer: 1200, 
          showConfirmButton: false 
        });
        return true;
      }
      Swal.fire({ 
        title: "Personnel introuvable", 
        text: `[${code}]`, 
        icon: "error" 
      });
      return false;
    } catch {
      Swal.fire({ title: "Erreur réseau", icon: "error" });
      return false;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const deconnecterAgent = useCallback(() => {
    setAgent(null);
    setBacsRecus([]);
    setSacsInfectes([]);
  }, []);

  const fetchLingesDuBac = useCallback(async (bacId) => {
    if (!bacId) return [];
    setLoadingLinges(true);
    try {
      const res = await fetch(`${API_URL}/api/linges/bac/${bacId}`);
      if (res.ok) {
        const data = await res.json();
        const linges = Array.isArray(data) ? data : data.content || [];
        if (isMounted.current) {
          setLingesAffichés(linges);
          setAfficherLinges(true);
        }
        return linges;
      }
      return [];
    } catch (err) {
      console.error("❌ Erreur fetchLingesDuBac:", err);
      return [];
    } finally {
      if (isMounted.current) setLoadingLinges(false);
    }
  }, []);

  const fermerLinges = useCallback(() => {
    setAfficherLinges(false);
    setLingesAffichés([]);
    setBacEnCours(null);
  }, []);

  const getBacByCode = useCallback(async (codeBac) => {
    try {
      const res = await fetch(`${API_URL}/api/bacs/code/${codeBac}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }, []);



  const scanReception = useCallback(async (code, agentParam) => {
  const agentUtilise = agentParam || agent;
  
  setLoading(true);
  try {
    const codeUpper = code.toUpperCase().trim();
    const estInfecte = codeUpper.startsWith("SAC");

    if (!estInfecte) {
      // Récupérer le bac
      const bac = await getBacByCode(codeUpper);
      if (!bac) {
        Swal.fire({ 
          title: "Bac introuvable", 
          text: `[${codeUpper}]`, 
          icon: "error" 
        });
        return;
      }

      const linges = await fetchLingesDuBac(bac.id);

      setBacEnCours({ 
        id: bac.id, 
        code: codeUpper,
        ...bac 
      });

      const codeBarre = agentUtilise?.codeBarre || agentUtilise?.matricule || "SYSTEM";

      const res = await fetch(
        `${API_URL}/api/reception?matricule=${encodeURIComponent(codeBarre)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            codesBac: [codeUpper], 
            numerosSacsInfectes: [] 
          })
        }
      );
      
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      
      const data = await res.json();
      const bacRecu = data.bacsRecus?.[0];
      
      if (bacRecu && isMounted.current) {
        setBacsRecus(prev => [...prev, bacRecu]);
        setDernierRecu({ 
          type: "BAC", 
          code: codeUpper, 
          data: bacRecu 
        });
        
        Swal.fire({ 
          title: "✅ Bac reçu", 
          html: `<b>${codeUpper}</b><br/>${linges.length} linge(s) réceptionné(s)`, 
          icon: "success", 
          timer: 1500, 
          showConfirmButton: false 
        });
      }
    } else {

      const matricule = agentUtilise?.codeBarre || agentUtilise?.matricule || "SYSTEM";
      
      const res = await fetch(
        `${API_URL}/api/sacs-infectes/recevoir?numeroSac=${encodeURIComponent(codeUpper)}&matricule=${encodeURIComponent(matricule)}`,
        { 
          method: "PUT",
          headers: { "Content-Type": "application/json" }
        }
      );
      
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      
      const sac = await res.json();
      
      if (isMounted.current) {
        setSacsInfectes(prev => [...prev, sac]);
        setDernierRecu({ 
          type: "SAC_INFECTE", 
          code: codeUpper, 
          data: sac 
        });
        
        let details = `<b>${codeUpper}</b><br/>`;
        if (sac.quantiteDeclaree) details += `${sac.quantiteDeclaree} articles`;
        if (sac.agentCollecteNom) details += ` • ${sac.agentCollecteNom}`;
        
        Swal.fire({ 
          title: "🔴 Sac infecté reçu", 
          html: details, 
          icon: "warning", 
          timer: 2500, 
          showConfirmButton: false 
        });
      }
    }
  } catch (err) {
    console.error("❌ Erreur scanReception:", err);
    Swal.fire({ 
      title: "Erreur", 
      text: err.message, 
      icon: "error" 
    });
  } finally {
    if (isMounted.current) setLoading(false);
  }
}, [agent, getBacByCode, fetchLingesDuBac]);


const fetchItemsDuSac = useCallback(async (numeroSac) => {
  if (!numeroSac) return [];
  setLoadingLinges(true);
  try {
    const res = await fetch(`${API_URL}/api/sacs-infectes/detail?numeroSac=${encodeURIComponent(numeroSac)}`);
    if (res.ok) {
      const data = await res.json();
      // Transformer les items pour les afficher comme des linges
      const items = data.items || [];
      const formattedItems = items.map((item, index) => ({
        id: `sac-item-${index}`,
        codeBarre: `${data.numeroSac}-${item.categorie}`,
        categorie: item.categorie,
        quantiteDeclaree: item.quantiteDeclaree,
        quantiteComptee: item.quantiteComptee,
        ecart: item.ecart,
        isSacItem: true,
        // Ajouter des infos supplémentaires pour l'affichage
        rfidTag: null,
        etat: "DECLARE",
        poids: null,
        sacNumero: data.numeroSac,
      }));
      if (isMounted.current) {
        setLingesAffichés(formattedItems);
        setAfficherLinges(true);
      }
      return formattedItems;
    }
    return [];
  } catch (err) {
    console.error("❌ Erreur fetchItemsDuSac:", err);
    return [];
  } finally {
    if (isMounted.current) setLoadingLinges(false);
  }
}, []);


  // ─── Passage RFID ──────────────────────────────────────────────────────
  const passagePortique = useCallback(async (codeBac, tags, agentParam) => {
    const agentUtilise = agentParam || agent;
    
    if (!codeBac) {
      Swal.fire({ title: "Code bac manquant", icon: "warning" });
      return;
    }
    if (!tags?.length) {
      Swal.fire({ title: "Tags manquants", icon: "warning" });
      return;
    }

    setLoading(true);
    try {
      const bac = await getBacByCode(codeBac);
      if (!bac) {
        Swal.fire({ 
          title: "Bac introuvable", 
          text: codeBac, 
          icon: "error" 
        });
        return;
      }

      const linges = await fetchLingesDuBac(bac.id);

      setBacEnCours({ 
        id: bac.id, 
        code: codeBac,
        ...bac 
      });

      const codeBarre = agentUtilise?.codeBarre || agentUtilise?.matricule || "SYSTEM";

      const res = await fetch(`${API_URL}/api/reception/receptionRfid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: codeBarre, 
          codeBac, 
          rfidTags: tags 
        })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        let msg = txt;
        try { msg = JSON.parse(txt).message || txt; } catch {}
        throw new Error(msg);
      }
      
      const resultat = await res.json();

      const typeBacNorm = (resultat.typeBac || "")
        .toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const estInfecte = typeBacNorm === "INFECTE";
      const r = { ...resultat, typeBac: estInfecte ? "INFECTE" : "BLANC" };

      if (isMounted.current) {
        setRfidResultat(r);
        setBacsRecus(prev => [...prev, { code: codeBac, ...r }]);
        setDernierRecu({ 
          type: "BAC", 
          code: codeBac, 
          data: r 
        });
      }

      if (estInfecte) {
        await Swal.fire({
          title: "🔴 BAC INFECTÉ DÉTECTÉ",
          html: `<div style="text-align:left;padding:8px">
            <p style="color:#dc2626;font-weight:600">⚠️ Ce bac contient du linge infecté !</p>
            <div style="background:#fee2e2;padding:10px;border-radius:8px;margin-bottom:10px">
              <b>Bac :</b> ${codeBac}<br/>
              <b>Linges :</b> ${linges.length}<br/>
              <b>Type :</b> INFECTÉ
            </div>
            <p style="font-size:13px;color:#64748b">🚨 Ce bac doit être orienté vers le <strong>circuit infecté</strong>.</p>
          </div>`,
          icon: "warning",
          iconColor: "#dc2626",
          confirmButtonText: "✅ Compris — Circuit infecté",
          confirmButtonColor: "#dc2626",
          allowOutsideClick: false,
        });
      } else {
        Swal.fire({ 
          title: "✅ Bac BLANC reçu", 
          html: `Bac <b>${codeBac}</b><br/><b>${linges.length}</b> linge(s)<br/><span style="color:#22c55e">→ Orienter vers le TRI</span>`, 
          icon: "success", 
          timer: 2500, 
          showConfirmButton: false 
        });
      }
    } catch (err) {
      console.error("❌ Erreur RFID:", err);
      Swal.fire({ 
        title: "Erreur RFID", 
        text: err.message, 
        icon: "error" 
      });
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [agent, getBacByCode, fetchLingesDuBac]);

  const resetRfid = useCallback(() => {
    setRfidResultat(null);
  }, []);

  const reset = useCallback(() => {
    setAgent(null);
    setDernierRecu(null);
    setBacEnCours(null);
    setLingesAffichés([]);
    setAfficherLinges(false);
    setRfidResultat(null);
    setBacsRecus([]);
    setSacsInfectes([]);
  }, []);

  return (
    <ReceptionContext.Provider value={{
      agent,
      bacsRecus,
      sacsInfectes,
      dernierRecu,
      bacEnCours,
      lingesAffichés,
      afficherLinges,
      loadingLinges,
      rfidResultat,
      loading,fetchItemsDuSac,
      scanAgent,
      deconnecterAgent,
      fetchLingesDuBac,
      fermerLinges,
      scanReception,
      passagePortique,
      resetRfid,
      reset,
    }}>
      {children}
    </ReceptionContext.Provider>
  );
}