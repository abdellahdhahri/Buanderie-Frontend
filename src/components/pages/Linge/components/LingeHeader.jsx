import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeaderIcon } from "../../../Layout/PageHeaderIcon";
import { PageHeader } from "../../../kit";

export function LingeHeader({ displayMode, total }) {
  const { t } = useTranslation();
  return (
    <PageHeader
      icon={<PageHeaderIcon size={40} />}
      title={displayMode === "RFID" ? t("linge.title_rfid") : t("linge.title")}
      subtitle={displayMode === "RFID" ? t("linge.subtitle_rfid") : t("linge.subtitle")}
      total={total}
    />
  );
}
