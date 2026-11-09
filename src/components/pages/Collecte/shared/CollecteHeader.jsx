import React from "react";
import { PageHeader } from "../../../kit";
import { PageHeaderIcon } from "../../../Layout/PageHeaderIcon";
import "./CollecteRh.css";

export function CollecteHeader({ icon, title, agent, agentLabel, noAgentLabel, badge, right }) {
  return (
    <PageHeader
      icon={<PageHeaderIcon size={40} icon={icon} />}
      title={title}
      subtitle={agent ? `${agentLabel} : ${agent.nomPrenom || agent.nom}` : noAgentLabel}
      badge={badge}
      right={right}
    />
  );
}
