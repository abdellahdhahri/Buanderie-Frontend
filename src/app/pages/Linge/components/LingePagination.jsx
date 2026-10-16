import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";

// ═══════════════════════════════════════════════════════════════════════════
// 📄 PAGINATION
// ═══════════════════════════════════════════════════════════════════════════
export function LingePagination({ currentPage, pageSize = 10, itemCount, totalElements, totalPages, isLoading, onPageChange }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        {t('common.showing')} {itemCount > 0 ? currentPage * pageSize + 1 : 0} {t('common.to')} {Math.min((currentPage + 1) * pageSize, totalElements)} {t('common.of')} {totalElements} {t('common.items')}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 0 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {t('common.previous')}
        </Button>
        <span className="text-sm">
          {t('common.page')} {currentPage + 1} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= (totalPages - 1) || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
