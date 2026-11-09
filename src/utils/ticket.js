import { CAPACITE_SAC_KG } from "../constants/collecte";

export function imprimerTicket(sac, index, serviceNom, chambreCode, agentNom) {
  const numeroSac   = sac.numeroLocal || `SAC-${String(index + 1)}`;
  const poidsEstime = sac.poidsEstime.toFixed(1);
  const totalArt    = sac.items.reduce((a, i) => a + i.quantite, 0);
  const dateStr     = new Date().toLocaleDateString("fr-FR");
  const heureStr    = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const barcodeUrl  = `https://barcodeapi.org/api/code128/${encodeURIComponent(numeroSac)}`;

  const html = `
    <div style="width:70mm;padding:3mm;font-family:'Courier New',monospace;background:white;">
      <div style="display:flex;justify-content:space-between;font-size:7pt;border-bottom:0.5pt solid black;margin-bottom:2mm;padding-bottom:1mm;">
        <span>${dateStr} ${heureStr}</span>
        <span style="color:#dc2626;font-weight:bold;">🔴 SAC INFECTÉ</span>
      </div>
      <div style="display:flex;justify-content:center;margin:2mm 0;">
        <img src="${barcodeUrl}" style="height:60px;max-width:100%;" alt="${numeroSac}"/>
      </div>
      <div style="text-align:center;font-size:8pt;font-weight:bold;letter-spacing:1px;margin-bottom:2mm;">${numeroSac}</div>
      <div style="border-top:0.5pt dashed black;margin-bottom:2mm;"></div>
      <div style="font-size:7pt;margin-bottom:1mm;">📍 Service : <strong>${serviceNom || "N/A"}</strong></div>
      <div style="font-size:7pt;margin-bottom:1mm;">🏠 Chambre : <strong>${chambreCode || "N/A"}</strong></div>
      <div style="font-size:7pt;margin-bottom:2mm;">⚖️ Poids : <strong>~${poidsEstime} / ${CAPACITE_SAC_KG} kg</strong></div>
      <div style="border-top:0.5pt dashed black;margin-bottom:2mm;"></div>
      <div style="font-size:7pt;font-weight:bold;margin-bottom:1mm;">CONTENU :</div>
      ${sac.items.map(i => `
        <div style="display:flex;justify-content:space-between;font-size:7pt;margin-bottom:0.5mm;">
          <span>${i.emoji} ${i.label}</span>
          <span style="font-weight:bold;">${i.quantite}</span>
        </div>`).join("")}
      <div style="display:flex;justify-content:space-between;font-size:8pt;font-weight:bold;border-top:0.5pt solid black;margin-top:1mm;padding-top:1mm;">
        <span>TOTAL</span><span>${totalArt} articles</span>
      </div>
      <div style="margin-top:2mm;padding:2mm;background:#fee2e2;color:#dc2626;text-align:center;font-size:8pt;font-weight:bold;border:1pt solid #dc2626;border-radius:2mm;">
        ⚠️ NE PAS OUVRIR<br/>LINGE INFECTÉ
      </div>
    </div>`;

  if (typeof window.printJS === "function") {
    window.printJS({
      printable: html, type: "raw-html",
      style: "* { margin:0; padding:0; box-sizing:border-box; }",
      documentTitle: `Ticket_${numeroSac}`
    });
  } else {
    const win = window.open("", "_blank", "width=320,height=580");
    if (win) {
      win.document.write(`<html><head><title>Ticket</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;justify-content:center;padding:10px;}</style></head><body>${html}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 800);
    }
  }
}
