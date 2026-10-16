import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import ScanInput from "../../../components/utils/shared/ScanInput";
import { ScanStatus } from "./ScanStatus";

/* ═══════════════════════════════════════════════════════════════════════════
   ZONE DE SCAN
   ═══════════════════════════════════════════════════════════════════════════ */
export function ZoneScan({
  scanInputRef, placeholder, value, onChange, onSubmit,
  borderColor, disabled, isCloturee, showShimmer, scanStatus,
  scanningLabel, successLabel,
}) {
  return (
    <Card style={{
      marginBottom: 20,
      border: `2px dashed ${borderColor}`,
      borderRadius: 16, position: "relative", overflow: "hidden",
      background: isCloturee ? "#f8fafc" : "white",
    }}>
      {showShimmer && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #14b8a6, #0d9488, #14b8a6)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
        }} />
      )}
      <CardContent className="p-5">
        <ScanInput
          ref={scanInputRef}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          borderColor={borderColor}
          keepFocus={true}
          autoDebounce={true}
          disabled={disabled}
        />
        <ScanStatus
          status={scanStatus}
          scanningLabel={scanningLabel}
          successLabel={successLabel}
        />
      </CardContent>
    </Card>
  );
}
