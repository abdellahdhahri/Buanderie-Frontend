import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaLayerGroup, FaThermometerHalf, FaTint, FaWind, FaCheck, FaEdit } from "react-icons/fa";
import { useSechage } from "../../contextes/SechageContext";

export default function LotInfoDialogSechage() {
  const { t } = useTranslation();
  const { lotDialog, setLotDialog, confirmerAjoutLot } = useSechage();
  const [manuel, setManuel] = useState(false);
  const [prog, setProg] = useState({ nom:"", temperature:"", niveauHumidite:"", duree:"" });
  
  if (!lotDialog) return null;
  const { lotInfo, lot } = lotDialog;
  
  const handleOk = () => {
    const scanInfo = manuel
      ? { ...lotInfo, temperature:prog.temperature, niveauHumidite:prog.niveauHumidite,
          duree:prog.duree, programmeRecommande:prog.nom }
      : lotInfo;
    confirmerAjoutLot(lot, scanInfo);
    setManuel(false); setProg({ nom:"", temperature:"", niveauHumidite:"", duree:"" });
  };
  
  const fermer = () => { setLotDialog(null); setManuel(false); };
  
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
            <div style={{ width:"38px",height:"38px",borderRadius:"10px",background:"#e0f2fe",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              <FaLayerGroup size={16} color="#0ea5e9"/>
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:"13px" }}>{t('lot_dialog_sechage.lot')} {lot.codeLot}</div>
              <div style={{ fontSize:"11px",color:"#64748b" }}>{lot.categorie} · {(lot.poidsActuel||0).toFixed(1)} kg</div>
            </div>
          </div>
          <button onClick={fermer} style={{ background:"#f1f5f9",border:"none",borderRadius:"50%",
            width:"30px",height:"30px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <FaTimes size={11} color="#64748b"/>
          </button>
        </div>
        
        {!manuel && lotInfo && (
          <div style={{ background:"#f0f9ff",borderRadius:"12px",padding:"14px",
            marginBottom:"14px",border:"1px solid #bae6fd" }}>
            <div style={{ fontWeight:700,fontSize:"12px",color:"#0369a1",marginBottom:"10px",
              display:"flex",alignItems:"center",gap:"5px" }}>
              <FaWind/> {lotInfo.programmeRecommande}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px" }}>
              {[
                [<FaThermometerHalf color="#dc2626"/>, t('lot_dialog_sechage.temperature'), `${lotInfo.temperature}°C`],
                [<FaTint color="#0ea5e9"/>,            t('lot_dialog_sechage.humidity'),    `${lotInfo.niveauHumidite||"—"}%`],
                [<FaWind color="#7c3aed"/>,            t('lot_dialog_sechage.duration'),       `${lotInfo.duree} min`],
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
            background:"linear-gradient(135deg,#0ea5e9,#0284c7)",color:"white",
            fontWeight:700,fontSize:"12px",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"5px" }}>
            <FaCheck size={11}/> {t('lot_dialog_sechage.add_to_dryer')}
          </button>
        </div>
      </div>
    </div>
  );
}