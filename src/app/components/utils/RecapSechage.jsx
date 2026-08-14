import React from "react";
import { FaWind, FaPlay, FaStop, FaTimes, FaLayerGroup, FaThermometerHalf, FaTint } from "react-icons/fa";
import { useSechage } from "../../contextes/SechageContext";
import MinuteurLavage from "./MinuteurLavage";

const couleurJauge = (p) => p>=90?"#ef4444":p>=70?"#f59e0b":"#0ea5e9";

export default function RecapSechage() {
  const { machine, lotsSelectionnes, retirerLot, poidsTotal, pctCharge,
          etape, cycleId, cycleInfo, demarrerSechage, terminerSechage, loading } = useSechage();
  const couleur = couleurJauge(pctCharge);
  return (
    <div style={{ background:"white",borderRadius:"16px",padding:"20px",
      border:"1px solid #e2e8f0",boxShadow:"0 4px 14px rgba(0,0,0,0.05)",
      position:"sticky",top:"20px" }}>
      <div style={{ fontWeight:700,fontSize:"14px",marginBottom:"14px",
        display:"flex",alignItems:"center",gap:"8px" }}>
        <FaWind color="#0ea5e9"/> Chargement séchoir
        {machine&&<span style={{ marginLeft:"auto",fontSize:"11px",color:"#64748b",
          background:"#f1f5f9",padding:"2px 8px",borderRadius:"8px" }}>
          {machine.code} · {machine.capaciteKg} kg
        </span>}
      </div>
      {machine&&(
        <div style={{ marginBottom:"16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"4px" }}>
            <span style={{ color:"#64748b" }}>Charge</span>
            <span style={{ fontWeight:700,color:couleur }}>{poidsTotal.toFixed(1)} / {machine.capaciteKg} kg</span>
          </div>
          <div style={{ height:"7px",background:"#f1f5f9",borderRadius:"4px",overflow:"hidden" }}>
            <div style={{ width:`${pctCharge}%`,height:"100%",background:couleur,
              borderRadius:"4px",transition:"width 0.3s" }}/>
          </div>
          <div style={{ marginTop:"3px",fontSize:"11px",color:pctCharge>=90?"#ef4444":"#94a3b8",textAlign:"right" }}>
            {pctCharge.toFixed(0)}%
          </div>
        </div>
      )}
      {etape==="EN_COURS"&&cycleInfo&&(
        <div style={{ marginBottom:"14px",padding:"11px",background:"#f0f9ff",
          borderRadius:"10px",border:"1px solid #bae6fd" }}>
          <div style={{ fontSize:"11px",color:"#0369a1",fontWeight:600,marginBottom:"5px" }}>
            Cycle #{cycleId} — {cycleInfo.programme}
          </div>
          <div style={{ display:"flex",gap:"8px",fontSize:"11px",color:"#64748b",marginBottom:"7px" }}>
            {cycleInfo.temperature!=="—"&&<span><FaThermometerHalf color="#dc2626" size={10}/> {cycleInfo.temperature}°C</span>}
            {cycleInfo.niveauHumidite!=="—"&&<span><FaTint color="#0ea5e9" size={10}/> {cycleInfo.niveauHumidite}%</span>}
          </div>
          <MinuteurLavage dateDebut={cycleInfo.dateDebut} dureePrevue={cycleInfo.dureePrevue}
            programme={cycleInfo.programme} temperature={cycleInfo.temperature}/>
        </div>
      )}
      {lotsSelectionnes.length>0&&(
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"12px",color:"#64748b",fontWeight:600,marginBottom:"7px" }}>
            {lotsSelectionnes.length} lot(s)
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"5px",maxHeight:"180px",overflowY:"auto" }}>
            {lotsSelectionnes.map(({lot,scanInfo})=>(
              <div key={lot.codeLot} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"7px 10px",borderRadius:"8px",background:"#f8fafc",border:"1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:"12px" }}>{lot.codeLot}</div>
                  <div style={{ fontSize:"10px",color:"#64748b" }}>
                    {lot.categorie} · {(lot.poidsActuel||0).toFixed(1)} kg
                    {scanInfo?.programmeRecommande&&<span style={{ color:"#0ea5e9" }}> · {scanInfo.programmeRecommande}</span>}
                  </div>
                </div>
                {etape!=="EN_COURS"&&(
                  <button onClick={()=>retirerLot(lot.codeLot)} style={{ background:"#fee2e2",border:"none",
                    borderRadius:"50%",width:"22px",height:"22px",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <FaTimes size={8} color="#dc2626"/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {lotsSelectionnes.length===0&&etape!=="EN_COURS"&&(
        <div style={{ textAlign:"center",padding:"20px 10px",color:"#94a3b8",fontSize:"12px" }}>
          <FaLayerGroup size={22} style={{ opacity:0.2,marginBottom:"6px" }}/>
          <div>Scannez un lot ou cliquez sur la liste</div>
        </div>
      )}
      {etape==="LOTS"&&(
        <button onClick={()=>demarrerSechage(poidsTotal)} disabled={lotsSelectionnes.length===0||loading}
          style={{ width:"100%",padding:"11px",borderRadius:"9px",border:"none",
            background:lotsSelectionnes.length===0||loading?"#e2e8f0":"linear-gradient(135deg,#0ea5e9,#0284c7)",
            color:lotsSelectionnes.length===0||loading?"#94a3b8":"white",
            fontWeight:700,fontSize:"12px",
            cursor:lotsSelectionnes.length===0||loading?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"6px" }}>
          <FaPlay size={10}/> Démarrer séchage ({lotsSelectionnes.length})
        </button>
      )}
      {etape==="EN_COURS"&&(
        <button onClick={terminerSechage} disabled={loading}
          style={{ width:"100%",padding:"11px",borderRadius:"9px",border:"none",
            background:loading?"#e2e8f0":"linear-gradient(135deg,#dc2626,#b91c1c)",
            color:loading?"#94a3b8":"white",fontWeight:700,fontSize:"12px",
            cursor:loading?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"6px" }}>
          <FaStop size={10}/> Terminer séchage #{cycleId}
        </button>
      )}
    </div>
  );
}
