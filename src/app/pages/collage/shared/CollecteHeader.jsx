import React from "react";
import { motion } from "framer-motion";
import { Icons } from "./icons";
import { PageHeaderIcon } from "../../../components/layout/PageHeaderIcon";

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER — titre de page + agent connecté
   ═══════════════════════════════════════════════════════════════════════════ */
export function CollecteHeader({
  icon, title,
  agent, agentLabel, noAgentLabel, accent,
}) {
  return (
    <div className="page-head" style={{ marginBottom: 32 }}>
      <div style={{
        display: "flex", alignItems: "center",
        gap: 16, marginBottom: 8,
      }}>
        <motion.div
          whileHover={{ rotate: -5, scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {/* Couleur de la section parente du menu (Zone sale) */}
          <PageHeaderIcon size={60} radius={20} icon={icon} />
        </motion.div>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: "#0f172a",
            margin: 0, letterSpacing: "-0.025em",
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: 13.5, color: "#64748b",
            margin: "4px 0 0 0", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {agent ? (
              <>
                <Icons.User size={13} color={accent} strokeWidth={2.2} />
                {`${agentLabel}: ${agent.nomPrenom || agent.nom}`}
              </>
            ) : (
              noAgentLabel
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
