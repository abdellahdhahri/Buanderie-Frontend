import React from "react";
import { useTranslation } from "react-i18next";
import { Pagination } from "../../../kit";

export function LingePagination({ currentPage, pageSize = 10, totalElements, totalPages, isLoading, onPageChange }) {
  const { t } = useTranslation();
  return (
    <Pagination
      total={totalElements || 0}
      page={currentPage + 1}
      totalPages={Math.max(totalPages || 0, 1)}
      pageSize={pageSize}
      onPage={(p) => { if (!isLoading) onPageChange(p - 1); }}
      unit={t("linge.title", "linge(s)").toLowerCase()}
    />
  );
}
