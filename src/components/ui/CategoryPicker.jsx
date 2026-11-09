import React from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { getCategorieMeta } from "../../constants/categoriesLinge";
import { getActiveCategories } from "../../utils/appSettings";
import "./CategoryPicker.css";

/**
 * Sélecteur de catégories de linge en cartes.
 * - multiple=false : value est une chaîne, onChange(cat)
 * - multiple=true  : value est un tableau, onChange(cats[])
 */
export function CategoryPicker({ value, onChange, multiple = false, invalid = false, categories: categoriesProp }) {
  const { t } = useTranslation();
  const selected = multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];
  // Catégories actives (Paramètres › Catégories) + celles déjà choisies, même désactivées
  const actives = categoriesProp || getActiveCategories();
  const categories = [...actives, ...selected.filter((c) => !actives.includes(c))];

  const toggle = (cat) => {
    if (!multiple) return onChange(cat);
    onChange(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  };

  return (
    <div className={`cat-picker${invalid ? " cat-picker--invalid" : ""}`}>
      {multiple && (
        <div className="cat-picker__toolbar">
          <span className="cat-picker__count">
            {t("category_picker.selected", { count: selected.length, total: categories.length })}
          </span>
          <div className="cat-picker__actions">
            <button type="button" onClick={() => onChange([...categories])} disabled={selected.length === categories.length}>
              {t("category_picker.select_all")}
            </button>
            <button type="button" onClick={() => onChange([])} disabled={selected.length === 0}>
              {t("category_picker.clear")}
            </button>
          </div>
        </div>
      )}

      <div className="cat-picker__grid" role={multiple ? "group" : "radiogroup"}>
        {categories.map((cat) => {
          const { Icon, accent } = getCategorieMeta(cat);
          const isSelected = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              onClick={() => toggle(cat)}
              className={`cat-card${isSelected ? " is-selected" : ""}`}
              style={{ "--cat-accent": accent }}
            >
              <span className="cat-card__icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="cat-card__label">{t(`categories.${cat}`, cat)}</span>
              <span className="cat-card__check" aria-hidden="true">
                <Check size={11} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryPicker;
