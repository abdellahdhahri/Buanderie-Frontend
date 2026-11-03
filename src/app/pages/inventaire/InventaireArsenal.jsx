import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Package,
  Weight,
  Calendar,
  X,
  Eye,
  Barcode,
  History,
  RefreshCw,
  Printer,
  Tag,
  Filter,
  Building2,
  Loader2,
  Box,
  ChevronDown,
  ChevronUp,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import printJS from "print-js";
import { PageHeaderIcon } from "../../components/layout/PageHeaderIcon";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function InventaireArsenal() {
  const { t } = useTranslation();

  const [scanValue, setScanValue] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [arsenals, setArsenals] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [totalSystemLinges, setTotalSystemLinges] = useState(0);
  const scanInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    }, 300);

    const handleClick = (e) => {
      if (e.target.closest('button, input, select, a')) return;
      if (scanInputRef.current && document.activeElement !== scanInputRef.current) {
        scanInputRef.current.focus();
        setIsFocused(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    clearTimeout(scanTimeoutRef.current);
    
    if (scanValue.trim().length >= 3 && !isLoading) {
      scanTimeoutRef.current = setTimeout(() => {
        const code = scanValue.trim().toUpperCase();
        if (code) {
          handleScan(code);
        }
      }, 400);
    }

    return () => clearTimeout(scanTimeoutRef.current);
  }, [scanValue]);

  const fetchTotalSystemLinges = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/linges/count`);
      if (response.ok) {
        const data = await response.json();
        setTotalSystemLinges(data || 0);
      } else {
        const total = arsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0);
        setTotalSystemLinges(total);
      }
    } catch (err) {
      console.error("Erreur chargement total linges:", err);
      const total = arsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0);
      setTotalSystemLinges(total);
    }
  }, [arsenals]);

  useEffect(() => {
    fetchTotalSystemLinges();
  }, []);

  useEffect(() => {
    const total = arsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0);
    setTotalSystemLinges(total);
  }, [arsenals]);

  const fetchArsenal = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/code/${code}?code=${code}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          Swal.fire({
            title: t('inventaire.not_found'),
            text: t('inventaire.not_found_text', { code }),
            icon: "error",
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            title: t('inventaire.error'),
            text: t('inventaire.error_status', { status: response.status, message: response.statusText }),
            icon: "error",
            timer: 1500,
            showConfirmButton: false
          });
        }
        setScanValue("");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (!data || !data.id) {
        Swal.fire({
          title: t('inventaire.invalid_data'),
          text: t('inventaire.invalid_data_text'),
          icon: "error",
          timer: 1500,
          showConfirmButton: false
        });
        setScanValue("");
        setIsLoading(false);
        return;
      }

      const existingIndex = arsenals.findIndex(a => a.id === data.id);
      
      let linges = [];
      try {
        linges = await fetchLingesArsenal(data.id);
      } catch (err) {
        console.warn("Erreur chargement linges:", err);
        linges = [];
      }
      
      if (existingIndex !== -1) {
        const updatedArsenals = [...arsenals];
        updatedArsenals[existingIndex] = {
          ...data,
          linges: linges
        };
        setArsenals(updatedArsenals);
        setExpandedId(data.id);
        Swal.fire({
          title: t('inventaire.arsenal_updated'),
          text: t('inventaire.arsenal_updated_text', {
            name: data.nom,
            code: data.code,
            count: linges.length
          }),
          icon: "info",
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        const newArsenal = { ...data, linges };
        setArsenals(prev => [newArsenal, ...prev]);
        setExpandedId(data.id);
        Swal.fire({
          title: t('inventaire.arsenal_added'),
          text: t('inventaire.arsenal_added_text', {
            name: data.nom,
            code: data.code,
            count: linges.length
          }),
          icon: "success",
          timer: 1200,
          showConfirmButton: false
        });
      }
      
      const newTotal = arsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0) + linges.length;
      setTotalSystemLinges(newTotal);
      
      setScanValue("");
    } catch (err) {
      console.error("Erreur fetchArsenal:", err);
      Swal.fire({
        title: t('inventaire.network_error'),
        text: t('inventaire.network_error_text'),
        icon: "error",
        timer: 1500,
        showConfirmButton: false
      });
      setScanValue("");
    } finally {
      setIsLoading(false);
    }
  }, [arsenals, t]);

  const fetchLingesArsenal = useCallback(async (arsenalId) => {
    try {
      const response = await fetch(`${API_URL}/api/Arsenals/arsenals/${arsenalId}/linges`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data;
        } else if (data && data.content) {
          return data.content;
        }
        return [];
      }
      return [];
    } catch (err) {
      console.error("Erreur chargement linges:", err);
      return [];
    }
  }, []);

  const handleScan = useCallback((code) => {
    if (!code || isLoading) return;
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 2) return;
    fetchArsenal(cleanCode);
  }, [isLoading, fetchArsenal]);

  const removeArsenal = (id) => {
    Swal.fire({
      title: t('inventaire.delete_arsenal_title'),
      text: t('inventaire.delete_arsenal_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('inventaire.delete_confirm'),
      cancelButtonText: t('inventaire.delete_cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedArsenals = arsenals.filter(a => a.id !== id);
        setArsenals(updatedArsenals);
        if (expandedId === id) {
          setExpandedId(null);
        }
        const total = updatedArsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0);
        setTotalSystemLinges(total);
      }
    });
  };

  const clearAll = () => {
    if (arsenals.length === 0) return;
    Swal.fire({
      title: t('inventaire.clear_all_title'),
      text: t('inventaire.clear_all_text'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t('inventaire.clear_all_confirm'),
      cancelButtonText: t('inventaire.clear_all_cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        setArsenals([]);
        setExpandedId(null);
        setTotalSystemLinges(0);
      }
    });
  };

  const handlePrintInventaire = () => {
    if (arsenals.length === 0) {
      Swal.fire({
        title: t('inventaire.no_data_print'),
        text: t('inventaire.no_data_print_text'),
        icon: "warning",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    let printContent = `
      <div style="width:80mm; padding:5mm; font-family:'Courier New',monospace; background:white;">
        <div style="text-align:center; border-bottom:2px solid black; padding-bottom:3mm; margin-bottom:3mm;">
          <h2 style="margin:0; font-size:14pt;">${t('inventaire.print_title')}</h2>
          <p style="margin:2px 0; font-size:8pt; color:#666;">${new Date().toLocaleString('fr-FR')}</p>
        </div>
        
        <div style="margin-bottom:3mm; padding:2mm; background:#f0fdf4; border:1px solid #86efac; border-radius:4px; text-align:center;">
          <div style="font-size:10pt; font-weight:bold; color:#166534;">${t('inventaire.print_total')}: ${totalSystemLinges}</div>
        </div>
    `;

    arsenals.forEach(arsenal => {
      const linges = arsenal.linges || [];
      const total = linges.length;
      const poidsTotal = linges.reduce((sum, l) => sum + (l.poids || 0), 0);
      
      printContent += `
        <div style="margin-bottom:3mm; border:1px solid #ddd; padding:2mm; border-radius:4px;">
          <div style="font-weight:bold; font-size:10pt;">${arsenal.code}</div>
          <div style="font-size:7pt; color:#666;">${arsenal.nom}</div>
          <div style="display:flex; justify-content:space-between; font-size:7pt; margin-top:1mm;">
            <span>${total} ${t('inventaire.linens_count')}</span>
            <span>${poidsTotal.toFixed(1)} ${t('inventaire.weight_unit')}</span>
          </div>
          ${linges.length > 0 ? `
            <div style="font-size:6pt; margin-top:1mm; border-top:1px solid #eee; padding-top:1mm;">
              ${linges.slice(0, 10).map(l => `
                <div style="display:flex; justify-content:space-between; padding:1px 0;">
                  <span>${l.codeBarre || 'N/A'}</span>
                  <span>${l.categorie || t('inventaire.uncategorized')}</span>
                </div>
              `).join('')}
              ${linges.length > 10 ? `<div style="text-align:center; color:#666;">${t('inventaire.print_and_others', { count: linges.length - 10 })}</div>` : ''}
            </div>` : `<div style="font-size:6pt; color:#999; margin-top:1mm;">${t('inventaire.print_no_linge')}</div>`}
        </div>
      `;
    });

    printContent += `
        <div style="text-align:center; font-size:6pt; margin-top:3mm; border-top:1px solid #ddd; padding-top:2mm; color:#666;">
          ${new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    `;

    printJS({
      printable: printContent,
      type: "raw-html",
      style: "* { margin: 0; padding: 0; box-sizing: border-box; }",
      documentTitle: "Inventaire_Arsenals",
      css: `
        @page { 
          size: 80mm auto;
          margin: 0;
        }
      `
    });
  };

  const getEtatBadge = (etat) => {
    const variants = {
      COLLECTE: { variant: "warning", label: t('linge_etat.COLLECTE') },
      EN_LAVAGE: { variant: "info", label: t('linge_etat.EN_LAVAGE') },
      LAVE: { variant: "success", label: t('linge_etat.LAVE') },
      SECHE: { variant: "success", label: t('linge_etat.SECHE') },
      STOCKE: { variant: "secondary", label: t('linge_etat.STOCKE') },
      SALE: { variant: "danger", label: t('linge_etat.SALE') },
      PROPRE_PRET: { variant: "success", label: t('linge_etat.PROPRE_PRET') },
      RECEPTIONNE: { variant: "success", label: t('linge_etat.RECEPTIONNE') },
      DISTRIBUE: { variant: "success", label: t('linge_etat.DISTRIBUE') },
      EN_TRI: { variant: "info", label: t('linge_etat.EN_TRI') },
      PRET_LIVRAISON: { variant: "success", label: t('linge_etat.PRET_LIVRAISON') },
    };
    const config = variants[etat] || { variant: "secondary", label: etat };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalLinges = arsenals.reduce((sum, a) => sum + (a.linges?.length || 0), 0);
  const totalPoids = arsenals.reduce((sum, a) => {
    const linges = a.linges || [];
    return sum + linges.reduce((s, l) => s + (l.poids || 0), 0);
  }, 0);

  return (
    <div className="relative flex h-full gap-4">
      <motion.div className="transition-all duration-500 ease-in-out w-full">
        <div className="space-y-4">
          <div className="page-head" style={{ marginBottom: "32px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "8px"
            }}>
              <PageHeaderIcon size={52} />
              <div>
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0
                }}>
                  {t('inventaire.title')}
                </h1>
                <p style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "2px 0 0 0"
                }}>
                  {t('inventaire.subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/65 backdrop-blur-md p-4 rounded-[20px] border border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
            <button
              onClick={clearAll}
              disabled={arsenals.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e03131]/30 rounded-[14px] text-sm font-bold text-[#e03131] hover:bg-[#e03131]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" /> {t('inventaire.clear_all')}
            </button>

            <div style={{ width: "1px", height: "30px", background: "#e2e8f0", margin: "0 8px" }} />

            <button
              disabled={arsenals.length === 0}
              onClick={handlePrintInventaire}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#8b5cf6]/30 rounded-[14px] text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" /> {t('inventaire.print_all')}
            </button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder={t('inventaire.scan_placeholder')}
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading}
                  className={`w-full h-10 pl-10 pr-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring ${
                    isFocused ? 'border-blue-500' : 'border-input'
                  } ${isLoading ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
                )}
                {scanValue && !isLoading && (
                  <button
                    onClick={() => setScanValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isFocused ? 'bg-green-500' : 'bg-slate-300'}`} />
                  {isFocused ? '🟢 ' + t('inventaire.scan_ready') : '⏸️ ' + t('inventaire.scan_inactive')}
                </span>
                <span>📷 {t('inventaire.scan_auto')}</span>
                <span>⏱️ {t('inventaire.scan_delay')}</span>
              </div>
            </CardContent>
          </Card>

          {arsenals.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{arsenals.length} {t('inventaire.arsenals_count')}{arsenals.length > 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-6 bg-blue-200" />
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{totalLinges} {t('inventaire.linens_count')}{totalLinges > 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-6 bg-blue-200" />
              <div className="flex items-center gap-2">
                <Weight className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{totalPoids.toFixed(1)} {t('inventaire.weight_unit')}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-emerald-700">{t('inventaire.total_linens_system')}</div>
                <div className="text-xs text-emerald-600">{t('inventaire.total_linens_system_sub')}</div>
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-700">{totalSystemLinges}</div>
          </div>

          {arsenals.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Barcode className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">{t('inventaire.no_data')}</h3>
                  <p className="text-sm text-slate-400">
                    {t('inventaire.no_data_text')}
                  </p>
                  <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
                    <span className="px-3 py-1 bg-slate-100 rounded-full">📷 {t('inventaire.auto_scan')}</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full">⚡ {t('inventaire.accumulation')}</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full">📦 {t('inventaire.inventory')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {arsenals.map((arsenal) => {
                const isExpanded = expandedId === arsenal.id;
                const linges = arsenal.linges || [];
                const nbLinges = linges.length;
                const poidsTotal = linges.reduce((sum, l) => sum + (l.poids || 0), 0);

                return (
                  <Card key={arsenal.id} className="overflow-hidden">
                    <div
                      className="p-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200 cursor-pointer hover:bg-blue-50/80 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : arsenal.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{arsenal.nom}</div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span className="font-mono">{arsenal.code}</span>
                              <span>•</span>
                              <span>{nbLinges} {t('inventaire.linens_count')}{nbLinges > 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>{poidsTotal.toFixed(1)} {t('inventaire.weight_unit')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {arsenal.serviceId ? `${t('inventaire.service')}: ${arsenal.serviceId}` : t('inventaire.unassigned')}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeArsenal(arsenal.id);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                            title={t('common.delete')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          {nbLinges === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <span className="text-sm">{t('inventaire.no_linge')}</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 bg-slate-50/50">
                              {linges.map((linge) => (
                                <div
                                  key={linge.id}
                                  className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <span className="font-mono text-sm font-medium text-blue-600 truncate">
                                          {linge.codeBarre || "N/A"}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-[10px]">
                                          {linge.categorie || t('inventaire.uncategorized')}
                                        </Badge>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-500">
                                          <Weight className="w-3 h-3 inline mr-1" />
                                          {linge.poids || 0} {t('inventaire.weight_unit')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                      {getEtatBadge(linge.etat)}
                                    </div>
                                  </div>
                                  {linge.rfidTag && (
                                    <div className="mt-1 text-xs text-purple-500 font-mono truncate">
                                      RFID: {linge.rfidTag}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}