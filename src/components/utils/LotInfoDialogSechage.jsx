import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaLayerGroup, FaThermometerHalf, FaTint, FaWind, FaCheck, FaEdit } from "react-icons/fa";
import { useSechage } from "../../contextes/SechageContext";
import { listeQuantites } from "../../services/lavageInfecteService";

export default function LotInfoDialogSechage() {
  const { t } = useTranslation();
  const { lotDialog, setLotDialog, confirmerAjoutLot } = useSechage();
  const [manuel, setManuel] = useState(false);
  const [prog, setProg] = useState({ nom:"", temperature:"", niveauHumidite:"", duree:"" });
  const [poids, setPoids] = useState(null);
  
  if (!lotDialog) return null;
  const { lotInfo, lot } = lotDialog;
  const quantites = listeQuantites(lot).length ? listeQuantites(lot) : listeQuantites(lotInfo);
  const quantiteDeclaree = lot.quantiteDeclaree ?? lotInfo?.quantiteDeclaree ?? null;
  const afficherQuantites = quantites.length > 0 || quantiteDeclaree != null;
  const poidsPropose = lot.poidsBalance ?? lotInfo?.poidsBalance ?? null;
  
  const handleOk = () => {
    const scanInfo = manuel
      ? { ...lotInfo, temperature:prog.temperature, niveauHumidite:prog.niveauHumidite,
          duree:prog.duree, programmeRecommande:prog.nom }
      : lotInfo;
    const saisi = poids ?? (poidsPropose != null ? String(poidsPropose) : "");
    const poidsCharge = saisi !== "" && Number(saisi) > 0 ? Number(saisi) : null;
    confirmerAjoutLot({ ...lot, poidsCharge, poidsActuel: poidsCharge ?? lot.poidsActuel }, scanInfo);
    setPoids(null);
    setManuel(false); setProg({ nom:"", temperature:"", niveauHumidite:"", duree:"" });
  };
  
  const fermer = () => { setLotDialog(null); setManuel(false); setPoids(null); };
  
  const F = (label, k, ph) => (
    <div style={{ marginBottom:"9px" }}>
      <label style={{ fontSize:"11px",color:"#64748b",fontWeight:600,display:"block",marginBottom:"3px" }}>{label}</label>
      <input value={prog[k]} onChange={e=>setProg(p=>({...p,[k]:e.target.value}))} placeholder={ph}
        style={{ width:"100%",padding:"8px 11px",borderRadius:"8px",border:"1px solid #e2e8f0",
          fontSize:"13px",outline:"none",boxSizing:"border-box" }}/>
    </div>
  );
  
  return (
    <div data-modal="true" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)" }}>
      <div style={{ background:"white",borderRadius:"20px",padding:"24px",maxWidth:"400px",
        width:"95%",boxShadow:"0 24px 60px rgba(0,0,0,0.2)" }}>
        
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <div style={{ width:"38px",height:"38px",borderRadius:"10px",background:"#e9f8fa",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FaLayerGroup size={16} color="#0794a4"/>
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:"13px" }}>{t('lot_dialog_sechage.bac', 'Bac')} {lot.codeLot}</div>
              <div style={{ fontSize:"11px",color:"#64748b" }}>{lot.categorie} · {(lot.poidsActuel||0).toFixed(1)} kg</div>
            </div>
          </div>
          <button onClick={fermer} style={{ background:"#f1f5f9",border:"none",borderRadius:"50%",
            width:"30px",height:"30px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <FaTimes size={11} color="#64748b"/>
          </button>
        </div>
        
        <div style={{ marginBottom:"14px" }}>
          <label style={{ fontSize:"11px",color:"#64748b",fontWeight:700,display:"block",marginBottom:"4px" }}>
            {t("lot_dialog.load_weight", "Poids de chargement (kg)")}
          </label>
          <input type="number" min="0" step="0.01"
            value={poids ?? (poidsPropose != null ? String(poidsPropose) : "")}
            onChange={e=>setPoids(e.target.value)}
            placeholder={t("lot_dialog.load_weight_placeholder", "Poids de la balance")}
            style={{ width:"100%",padding:"8px 11px",borderRadius:"8px",border:"1px solid #e2e8f0",
              fontSize:"14px",fontWeight:700,outline:"none",boxSizing:"border-box" }}/>
          <div style={{ fontSize:"11px",color:"#64748b",marginTop:"4px" }}>
            {poidsPropose != null
              ? t("lot_dialog.load_weight_hint", "Proposé : poids de la balance du bac ({{kg}} kg). Modifiable.", { kg: Number(poidsPropose).toFixed(2) })
              : t("lot_dialog.load_weight_none", "Aucune pesée : saisissez le poids de la charge.")}
          </div>
        </div>

        {!manuel && lotInfo && (
          <div style={{ background:"#f8fafc",borderRadius:"12px",padding:"14px",
            marginBottom:"14px",border:"1px solid #e2e8f0" }}>
            <div style={{ fontWeight:700,fontSize:"12px",color:"#067a87",marginBottom:"10px",
              display:"flex",alignItems:"center",gap:"5px" }}>
              <FaWind/> {lotInfo.programmeRecommande}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px" }}>
              {[
                [<FaThermometerHalf color="#dc2626"/>, t('lot_dialog_sechage.temperature'), `${lotInfo.temperature}°C`],
                [<FaTint color="#0ea5e9"/>,            t('lot_dialog_sechage.humidity'),    `${lotInfo.niveauHumidite||"—"}%`],
                [<FaWind color="#64748b"/>,            t('lot_dialog_sechage.duration'),       `${lotInfo.duree} min`],
              ].map(([icon,label,val])=>(
                <div key={label} style={{ textAlign:"center",padding:"7px 4px",
                  background:"white",borderRadius:"8px",border:"1px solid #e2e8f0" }}>
                  <div style={{ marginBottom:"2px" }}>{icon}</div>
                  <div style={{ fontSize:"10px",color:"#64748b" }}>{label}</div>
                  <div style={{ fontWeight:700,fontSize:"12px" }}>{val}</div>
                </div>
              ))}
            </div>
            {lotInfo.description && (
              <div style={{ marginTop:"7px",fontSize:"11px",color:"#64748b",
                padding:"5px 9px",background:"white",borderRadius:"6px" }}>{lotInfo.description}</div>
            )}
          </div>
        )}
        
        {afficherQuantites && (
          <div style={{ background:"#fef2f2",borderRadius:"12px",padding:"12px 14px",
            marginBottom:"14px",border:"1px solid #fecaca" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: quantites.length ? "8px" : 0 }}>
              <span style={{ fontWeight:700,fontSize:"12px",color:"#b91c1c" }}>{t("lavage_infecte.quantities")}</span>
              {quantiteDeclaree != null && (
                <span style={{ fontSize:"11px",color:"#7f1d1d" }}>
                  {t("lavage_infecte.total_declared")} : <b>{quantiteDeclaree}</b>
                </span>
              )}
            </div>
            {quantites.length > 0 && (
              <div style={{ display:"flex",flexWrap:"wrap",gap:"6px" }}>
                {quantites.map((q) => (
                  <span key={q.categorie} style={{ display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 9px",
                    borderRadius:"999px",background:"white",border:"1px solid #fecaca",fontSize:"11px",color:"#0f172a" }}>
                    {t(`categories.${q.categorie}`, q.categorie)} <b style={{ color:"#b91c1c" }}>{q.quantite}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {manuel && <div style={{ marginBottom:"12px" }}>
          {F(t('lot_dialog_sechage.program_name'),"nom",t('lot_dialog_sechage.program_name_placeholder'))}
          {F(t('lot_dialog_sechage.temperature'),"temperature",t('lot_dialog_sechage.temperature_placeholder'))}
          {F(t('lot_dialog_sechage.humidity_target'),"niveauHumidite",t('lot_dialog_sechage.humidity_placeholder'))}
          {F(t('lot_dialog_sechage.duration'),"duree",t('lot_dialog_sechage.duration_placeholder'))}
        </div>}
        
        <button onClick={()=>setManuel(p=>!p)} style={{ display:"flex",alignItems:"center",gap:"5px",
          background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"11px",marginBottom:"12px" }}>
          <FaEdit size={10}/> {manuel ? t('lot_dialog_sechage.use_suggested') : t('lot_dialog_sechage.manual_entry')}
        </button>
        
        <div style={{ display:"flex",gap:"9px" }}>
          <button onClick={fermer} style={{ flex:1,padding:"10px",borderRadius:"9px",
            border:"1px solid #e2e8f0",background:"white",color:"#64748b",
            fontWeight:600,fontSize:"12px",cursor:"pointer" }}>
            {t('common.cancel')}
          </button>
          <button onClick={handleOk} style={{ flex:2,padding:"10px",borderRadius:"9px",border:"none",
            background:"#0794a4",color:"white",
            fontWeight:700,fontSize:"12px",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"5px" }}>
            <FaCheck size={11}/> {t('lot_dialog_sechage.add_to_dryer')}
          </button>
        </div>
      </div>
    </div>
  );
}