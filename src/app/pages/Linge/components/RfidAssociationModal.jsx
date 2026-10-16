import React from "react";
import { useTranslation } from "react-i18next";
import { Tag, Package } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { FormField, ModernInput, ModalActions } from "./FormControls";

// ═══════════════════════════════════════════════════════════════════════════
// 📡 MODAL ASSOCIATION RFID
// ═══════════════════════════════════════════════════════════════════════════
export function RfidAssociationModal({ isOpen, onClose, linge, rfidCode, setRfidCode, onSubmit }) {
  const { t } = useTranslation();
  const canSubmit = !!rfidCode.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="edit"
      icon={<Tag className="w-5 h-5" strokeWidth={2.4} />}
      title={t('linge.associate_rfid_tag')}
      subtitle="Associer un tag RFID à un linge existant"
      size="md"
    >
      <div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{
            padding: "14px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #f5f3ff, #ffffff)",
            border: "1px solid #ddd6fe"
          }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: "#7c3aed",
              textTransform: "uppercase", letterSpacing: "0.5px",
              marginBottom: "8px"
            }}>
              {t('linge.selected_linen')}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white"
              }}>
                <Package className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "13px", fontWeight: 800, color: "#0f172a",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {linge?.codebarre || "—"}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                  {linge?.categorie || "—"}
                </div>
              </div>
            </div>
          </div>

          <FormField
            label={`RFID ${t('common.tag')}`}
            required
            icon={<Tag size={12} />}
            hint={t('linge.rfid_scan_hint')}
          >
            <ModernInput
              type="text"
              placeholder={t('linge.scan_or_enter_rfid')}
              value={rfidCode}
              onChange={(e) => setRfidCode(e.target.value)}
              autoFocus
            />
          </FormField>
        </div>

        <ModalActions>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            style={{
              flex: 1, padding: "12px",
              borderRadius: "12px", fontWeight: 700, fontSize: "13px"
            }}
          >
            {t('common.cancel')}
          </Button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              flex: 1.5, padding: "12px", borderRadius: "12px", border: "none",
              background: canSubmit
                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                : "linear-gradient(135deg, #cbd5e1, #94a3b8)",
              color: "white", fontWeight: 700, fontSize: "13px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "8px", transition: "all 0.2s ease",
              boxShadow: canSubmit ? "0 4px 16px rgba(139,92,246,0.30)" : "none",
              opacity: canSubmit ? 1 : 0.7
            }}
          >
            <Tag className="w-4 h-4" strokeWidth={2.6} />
            {t('linge.associate_rfid')}
          </button>
        </ModalActions>
      </div>
    </Modal>
  );
}
