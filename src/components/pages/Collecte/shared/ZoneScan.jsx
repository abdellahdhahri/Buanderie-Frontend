import React from "react";
import ScanInput from "../../../utils/shared/ScanInput";
import { ScanStatus } from "./ScanStatus";
import "./CollecteRh.css";

export function ZoneScan({
  scanInputRef, placeholder, value, onChange, onSubmit,
  borderColor, disabled, isCloturee, showShimmer, scanStatus,
  scanningLabel, successLabel,
}) {
  return (
    <section className={`cr-scan ${isCloturee ? "is-closed" : ""}`}>
      {showShimmer && <span className="cr-scan__bar" />}
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
      <ScanStatus status={scanStatus} scanningLabel={scanningLabel} successLabel={successLabel} />
    </section>
  );
}
