import React from "react";
import { useTranslation } from "react-i18next";
import { FaRss } from "react-icons/fa";
import { Eye, Tag, Loader2, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { EtatBadge } from "./EtatBadge";
import { ATTRIBUT_META, useAttributLabel } from "./LingeIncompletsBanner";

// ═══════════════════════════════════════════════════════════════════════════
// 📋 TABLEAU DES LINGES
// ═══════════════════════════════════════════════════════════════════════════
export function LingeTable({
  linges,
  isLoading,
  displayMode,
  selectedId,
  formatEPC,
  getServiceName,
  onRowClick,
  onDetail,
  onAssociateRfid,
  showMissing = false,
}) {
  const { t } = useTranslation();
  const attributLabel = useAttributLabel();
  const nbCols = showMissing ? 10 : 9;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="text-center py-3 px-4">{t('common.id')}</th>
                <th className="text-center py-3 px-4">{displayMode === "RFID" ? t('linge.rfid_tag') : t('common.code')}</th>
                <th className="text-center py-3 px-4">{t('linge.category')}</th>
                <th className="text-center py-3 px-4">{t('linge.weight')}</th>
                <th className="text-center py-3 px-4">{t('linge.status')}</th>
                <th className="text-center py-3 px-4">{t('linge.service')}</th>
                <th className="text-center py-3 px-4">{t('linge.carrier')}</th>
                <th className="text-center py-3 px-4">RFID</th>
                {showMissing && <th className="text-center py-3 px-4">{t('linge.incomplets.missing', 'Informations manquantes')}</th>}
                <th className="text-center py-3 px-4 actions-th">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={nbCols} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : linges.length === 0 ? (
                <tr>
                  <td colSpan={nbCols} className="text-center py-8 text-muted-foreground">
                    {t('linge.no_articles')}
                  </td>
                </tr>
              ) : (
                linges.map((l) => {
                  const serviceName = getServiceName(l.serviceId);
                  const isSelected = selectedId === l.id;
                  const hasRfid = l.rfidTag && l.rfidTag !== "";
                  const isUniformeRow = l.categorie === "UNIFORME";

                  return (
                    <tr
                      key={l.id}
                      onClick={() => onRowClick(l.id)}
                      className={isSelected ? "expanded is-selected" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="text-center py-3 px-4">
                        <span className="code-badge">{l.id}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        {displayMode === "RFID" ? (
                          l.rfidTag ? (
                            <code className="rfid-tag">{formatEPC(l.rfidTag)}</code>
                          ) : (
                            <span className="text-muted-foreground text-sm">{t('linge.not_associated')}</span>
                          )
                        ) : (
                          <code className="tracking-code">{l.codebarre}</code>
                        )}
                      </td>
                      <td className="text-center font-semibold text-slate-800">{t(`categories.${l.categorie}`, l.categorie)}</td>
                      <td className="text-center font-bold">{l.poids != null ? `${l.poids} kg` : <span className="text-slate-300">—</span>}</td>
                      <td className="text-center"><EtatBadge etat={l.etat} /></td>
                      <td className="text-center">{serviceName}</td>
                      <td className="text-center">
                        {isUniformeRow ? (
                          l.porteurNom ? (
                            <span className="text-xs font-medium text-blue-600 flex items-center justify-center gap-1">
                              <UserIcon className="w-3 h-3" /> {l.porteurNom}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">{t('linge.unassigned')}</span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {hasRfid ? (
                          <Badge variant="success" className="text-xs">
                            <FaRss className="mr-1" size={10} /> {l.rfidTag.substring(0, 8)}...
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t('linge.not_associated')}</Badge>
                        )}
                      </td>
                      {showMissing && (
                        <td className="text-center py-3 px-4">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {(l.attributsManquants || []).map((a) => {
                              const M = ATTRIBUT_META[a];
                              return (
                                <span key={a} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                                  {M && <M.Icon className="h-3 w-3" />}
                                  {attributLabel(a)}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDetail(l.id);
                            }}
                            className="text-[#0794a4] hover:text-[#068391] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                          >
                            <Eye className="w-4 h-4" /> {t('common.details')}
                          </button>
                          {!hasRfid && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssociateRfid(l);
                              }}
                              className="text-[#8b5cf6] hover:text-[#7c3aed] font-semibold text-sm flex items-center gap-1.5 hover:underline"
                            >
                              <Tag className="w-4 h-4" /> RFID
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
