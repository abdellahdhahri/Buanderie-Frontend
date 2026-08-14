import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import { User, CheckCircle, XCircle, RotateCcw, Package, ShieldAlert, Wifi, Eye } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ReceptionProvider, useReception } from "../../contextes/ReceptionContext";
import ModeToggle from "../../components/utils/shared/ModeToggle";
import PanneauLinges from "../../components/utils/reception/PanneauLinges";
import Swal from "sweetalert2";

function ReceptionInner() {
  const {
    agent,
    bacsRecus = [],  // ← Valeur par défaut
    sacsInfectes = [],  // ← Valeur par défaut
    dernierRecu,
    bacEnCours,
    lingesAffichés = [],  // ← Valeur par défaut
    afficherLinges = false,
    loadingLinges = false,
    loading = false,
    scanAgent,
    deconnecterAgent,
    fetchLingesDuBac,
    fermerLinges,
    scanReception,
    passagePortique,
    reset,
  } = useReception();

  const [scanValue, setScanValue] = useState("");
  const [mode, setMode] = useState("BARCODE");
  const [rfidCodeBac, setRfidCodeBac] = useState("");
  const [rfidTags, setRfidTags] = useState("");
  const [rfidLoading, setRfidLoading] = useState(false);

  const scanInputRef = useRef(null);
  const rfidBacRef = useRef(null);
  const rfidTagsRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Focus permanent
  useEffect(() => {
    if (mode !== "BARCODE") return;
    const keepFocus = () => {
      if (scanInputRef.current && !document.querySelector('[data-modal="true"]')) {
        scanInputRef.current.focus();
      }
    };
    const id = setInterval(keepFocus, 500);
    keepFocus();
    return () => clearInterval(id);
  }, [mode]);

  // Debounce scan auto
  useEffect(() => {
    if (mode !== "BARCODE" || scanValue.trim().length < 3) return;
    const t = setTimeout(() => {
      const code = scanValue.trim();
      setScanValue("");

      if (!agent) {
        scanAgent(code);
      } else {
        scanReception(code);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [scanValue, mode, agent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = scanValue.trim();
    if (!code) return;
    setScanValue("");

    if (!agent) {
      scanAgent(code);
    } else {
      scanReception(code);
    }
  };

  const handlePortique = async () => {
    const tags = rfidTags.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);
    setRfidLoading(true);
    await passagePortique(rfidCodeBac.trim(), tags);
    setRfidCodeBac("");
    setRfidTags("");
    setRfidLoading(false);
  };

  const handleReset = () => {
    setScanValue("");
    setRfidCodeBac("");
    setRfidTags("");
    reset();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Déconnecter ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#0ea5e9"
    }).then(r => {
      if (r.isConfirmed) {
        deconnecterAgent();
        handleReset();
      }
    });
  };

  const getPlaceholder = () => {
    if (!agent) return "👤 Scanner votre badge agent...";
    return "📦 Scanner un bac ou un sac infecté...";
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0, textAlign: "left" }}>
        <h1 className="text-3xl font-extrabold" style={{ marginBottom: "4px" }}>
          📦 Réception
        </h1>
      
      </div>

      {/* Barre actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap items-center">
          {agent && (
            <Button variant="outline" onClick={handleLogout}>
              <User className="w-4 h-4 mr-2" /> Changer
            </Button>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${agent ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
          {agent
            ? <><CheckCircle className="w-4 h-4 text-green-500" /> {agent.nom}</>
            : <><XCircle className="w-4 h-4" /> Hors ligne</>}
        </div>
      </div>

      {/* ── Zone scan CODE-BARRES ── */}
      {mode === "BARCODE" && (
        <Card className={`border-2 ${agent ? "border-sky-400" : "border-dashed border-slate-200"}`}>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {!agent ? <User size={18} /> : <Package size={18} />}
                </div>
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder={getPlaceholder()}
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  autoFocus
                />
                {scanValue && (
                  <button
                    type="button"
                    onClick={() => setScanValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </form>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              {loading
                ? "⏳ Traitement..."
                : agent
                  ? "✅ Agent connecté — Scan bac ou sac infecté"
                  : "👤 En attente du badge agent"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Zone scan RFID ── */}
      {mode === "RFID" && (
        <Card style={{ border: "2px solid #c4b5fd" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wifi size={20} color="#7c3aed" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#7c3aed" }}>Portique RFID</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Tags lus automatiquement</div>
              </div>
            </div>

            {!agent && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="👤 Scanner badge agent..."
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && scanValue.trim()) {
                      scanAgent(scanValue.trim());
                      setScanValue("");
                    }
                  }}
                  ref={scanInputRef}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none text-sm"
                />
              </div>
            )}

            {agent && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="📦 Code bac"
                    value={rfidCodeBac}
                    onChange={e => setRfidCodeBac(e.target.value)}
                    ref={rfidBacRef}
                    className="h-10 px-3 rounded-lg border border-input bg-background focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    placeholder="📡 Tags RFID (séparés par virgule)"
                    value={rfidTags}
                    onChange={e => setRfidTags(e.target.value)}
                    ref={rfidTagsRef}
                    onKeyDown={e => { if (e.key === "Enter") handlePortique(); }}
                    className="h-10 px-3 rounded-lg border border-input bg-background focus:outline-none text-sm"
                  />
                </div>
                <Button
                  onClick={handlePortique}
                  disabled={rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()}
                  className="w-full mt-3"
                  style={{
                    background: rfidLoading || !rfidCodeBac.trim() || !rfidTags.trim()
                      ? undefined
                      : "linear-gradient(135deg,#7c3aed,#6d28d9)"
                  }}
                >
                  {rfidLoading ? "⏳ Lecture..." : "✅ Valider le passage"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Dernier reçu ── */}
      {dernierRecu && (
        <Card style={{
          border: `2px solid ${dernierRecu.type === "BAC" ? "#0ea5e9" : "#dc2626"}`,
          background: dernierRecu.type === "BAC" ? "#f0f9ff" : "#fff5f5"
        }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              {dernierRecu.type === "BAC"
                ? <Package size={18} className="text-sky-500" />
                : <ShieldAlert size={18} className="text-red-500" />}
              <Badge variant={dernierRecu.type === "BAC" ? "default" : "destructive"}>
                {dernierRecu.type === "BAC" ? "Bac" : "Sac infecté"}
              </Badge>
              <code style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                background: dernierRecu.type === "BAC" ? "#dbeafe" : "#fee2e2",
                color: dernierRecu.type === "BAC" ? "#1d4ed8" : "#dc2626"
              }}>
                {dernierRecu.code}
              </code>
              {dernierRecu.type === "BAC" && bacEnCours && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchLingesDuBac(bacEnCours.id)}
                  className="text-xs h-7"
                >
                  <Eye className="w-3 h-3 mr-1" /> Voir linges
                </Button>
              )}
              {dernierRecu.type === "SAC_INFECTE" && (
                <span className="text-sm text-slate-500">
                  {dernierRecu.data?.quantiteDeclaree || 0} art.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Panneau linges ── */}
      {afficherLinges && (
        <Card style={{ border: "2px solid #0ea5e9", background: "#f0f9ff" }}>
          <CardContent className="p-4">
            <PanneauLinges
              linges={lingesAffichés || []}
              titre={`Linges du bac ${bacEnCours?.code || ""}`}
              bacCode={bacEnCours?.code}
              isLoading={loadingLinges}
              onClose={fermerLinges}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Résumé des bacs reçus ── */}
      {agent && (bacsRecus.length > 0 || sacsInfectes.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {bacsRecus.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 font-medium">Bacs reçus</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bacsRecus.map((bac, i) => (
                      <Badge key={i} variant="outline" className="bg-sky-50">
                        {bac.codeBac || bac.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {sacsInfectes.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 font-medium">Sacs infectés</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {sacsInfectes.map((sac, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700">
                        {sac.numeroSac}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex gap-4">
          {agent && <span>Agent : <strong className="text-slate-600">{agent.nom}</strong></span>}
          {agent && (
            <>
              <span>Bacs : <strong className="text-sky-600">{bacsRecus.length}</strong></span>
              <span>Sacs : <strong className="text-red-600">{sacsInfectes.length}</strong></span>
            </>
          )}
          <Badge variant="outline" style={{ fontSize: "11px" }}>
            {mode === "RFID" ? "📡 RFID" : "📷 Code-barres"}
          </Badge>
        </div>
        <span>
          {new Date().toLocaleDateString("fr-FR")} {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

    </div>
  );
}

export default function ReceptionList() {
  return <ReceptionProvider><ReceptionInner /></ReceptionProvider>;
}