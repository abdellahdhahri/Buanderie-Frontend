import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Ban, ListPlus } from "lucide-react";
import Swal from "../../kit/dialogueApi";
import { arsenalService, emplacementService } from "../../../services/arsenalService";
import { useIntegration } from "../../../hooks/useIntegration";
import {
  ActionBar, ActionButton, DataTable, Badge, Modal, Button, FormField, FormGrid, RowActions, RowButton, Code,
} from "../../kit";
import { lireNoms } from "./ImportArsenauxCubix";
import { IconAjouter } from "../../kit/ActionIcons";

const VIDE = { nom: "", numero: "", codeBarre: "", actif: true };

export function BadgeImporte({ item }) {
  const { t } = useTranslation();
  const { modeCubix } = useIntegration();
  if (item?.source !== "EXTERNE") return null;
  return <span className="kit-tag">{modeCubix ? "CUBIX" : t("integration.imported", "Importé")}</span>;
}

export function BadgeInactif({ item }) {
  const { t } = useTranslation();
  if (item?.actif !== false) return null;
  return <span className="kit-tag kit-tag--muted">{t("common.inactive", "Inactif")}</span>;
}

export function ArsenalEmplacements({ arsenal, tous }) {
  const { t } = useTranslation();
  const { estImporte, modeCubix } = useIntegration();
  const cubix = modeCubix && arsenal.source === "EXTERNE";
  const [multi, setMulti] = useState(null);
  const [emplacements, setEmplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rafraichir, setRafraichir] = useState(0);
  const [edition, setEdition] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let actif = true;
    arsenalService.getEmplacements(arsenal.id, tous)
      .then((data) => actif && setEmplacements(Array.isArray(data) ? data : []))
      .catch((err) => actif && Swal.fire({ title: t("common.error"), text: err.message, icon: "error" }))
      .finally(() => actif && setLoading(false));
    return () => { actif = false; };
  }, [arsenal.id, tous, rafraichir, t]);

  const recharger = () => {
    setLoading(true);
    setRafraichir((n) => n + 1);
  };

  const ouvrir = (emp) => {
    setEdition(emp || "nouveau");
    setForm(emp ? { nom: emp.nom || "", numero: emp.numero ?? "", codeBarre: emp.codeBarre || "", actif: emp.actif !== false } : VIDE);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        arsenalId: arsenal.id,
        nom: form.nom.trim(),
        numero: form.numero === "" ? null : Number(form.numero),
        codeBarre: form.codeBarre.trim() || null,
        actif: form.actif,
      };
      if (edition === "nouveau") await emplacementService.create(payload);
      else await emplacementService.update(edition.id, payload);
      setEdition(null);
      recharger();
      Swal.fire({ title: "✅", text: t("arsenal.location_saved", "Emplacement enregistré."), icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const ajouterPlusieurs = async (e) => {
    e.preventDefault();
    const noms = lireNoms(multi);
    if (!noms.length) return;
    setSaving(true);
    try {
      const res = await arsenalService.ajouterEmplacements(arsenal.id, noms);
      const n = Array.isArray(res?.crees) ? res.crees.length : 0;
      setMulti(null);
      recharger();
      Swal.fire({ title: "✅", text: `${n} ${t("arsenal.created", "créé(s)")}${res?.message ? ` — ${res.message}` : ""}`, icon: "success" });
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const desactiver = async (emp) => {
    const result = await Swal.fire({
      title: t("arsenal.location_disable_confirm", "Désactiver cet emplacement ?"),
      text: emp.nom,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: t("arsenal.disable", "Désactiver"),
      cancelButtonText: t("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      await emplacementService.desactiver(emp.id);
      recharger();
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error" });
    }
  };

  const COLONNES = {
    numero: { label: t("arsenal.number", "N°"), align: "center", render: (emp) => <strong>{emp.numero ?? "—"}</strong> },
    nom: { label: t("common.name"), render: (emp) => <>{emp.nom}<BadgeImporte item={emp} /><BadgeInactif item={emp} /></> },
    codeBarre: { label: t("arsenal.barcode", "Code-barres"), align: "center", render: (emp) => <Code>{emp.codeBarre}</Code> },
    actions: {
      label: t("common.actions"), align: "center",
      render: (emp) => (emp.source === "EXTERNE" ? <Badge variant="secondary">{t("integration.imported", "Importé")}</Badge> : (
        <RowActions>
          <RowButton icon={Pencil} title={t("common.edit")} onClick={() => ouvrir(emp)} />
          {emp.actif !== false && <RowButton icon={Ban} tone="danger" title={t("arsenal.disable", "Désactiver")} onClick={() => desactiver(emp)} />}
        </RowActions>
      )),
    },
  };

  return (
    <>
      {(!estImporte("EMPLACEMENT") || cubix) && (
        <ActionBar>
          <ActionButton icon={IconAjouter} label={t("arsenal.new_location", "Ajouter un emplacement")} variant="ajouter" onClick={() => ouvrir(null)} />
          {cubix && <ActionButton icon={ListPlus} label={t("arsenal.add_locations", "Ajouter des emplacements")} variant="ajouter" onClick={() => setMulti("")} />}
        </ActionBar>
      )}
      <DataTable
        columns={COLONNES}
        rows={emplacements}
        rowClassName={(emp) => (emp.actif === false ? "kit-row-inactive" : "")}
        loading={loading}
        loadingText={t("common.loading")}
        emptyText={t("arsenal.no_locations", "Aucun emplacement.")}
      />

      {multi !== null && (
        <Modal
          className="kit-std-form"
          size="sm"
          title={t("arsenal.add_locations", "Ajouter des emplacements")}
          subtitle={arsenal.nom}
          onClose={saving ? undefined : () => setMulti(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setMulti(null)} disabled={saving}>{t("common.cancel")}</Button>
              <Button type="submit" form="emplacements-multi-form" disabled={saving || !lireNoms(multi).length}>{saving ? t("common.saving") : `${t("common.save")} (${lireNoms(multi).length})`}</Button>
            </>
          )}
        >
          <form id="emplacements-multi-form" onSubmit={ajouterPlusieurs}>
            <FormField label={t("arsenal.locations_to_create", "Noms (un par ligne)")} required>
              <textarea rows={6} value={multi} onChange={(e) => setMulti(e.target.value)} placeholder={"C1\nC2"} />
            </FormField>
          </form>
        </Modal>
      )}

      {edition && (
        <Modal
          className="kit-std-form"
          size="sm"
          title={edition === "nouveau" ? t("arsenal.new_location", "Ajouter un emplacement") : `${t("arsenal.edit_location", "Modifier l'emplacement")} #${edition.id}`}
          subtitle={arsenal.nom}
          onClose={saving ? undefined : () => setEdition(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setEdition(null)} disabled={saving}>{t("common.cancel")}</Button>
              <Button type="submit" form="emplacement-form" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
            </>
          )}
        >
          <form id="emplacement-form" onSubmit={enregistrer}>
            <FormGrid>
              <FormField label={t("common.name")} required>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </FormField>
              <FormField label={t("arsenal.number", "N°")}>
                <input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
              </FormField>
              {!modeCubix && (
                <FormField label={t("arsenal.barcode", "Code-barres")}>
                  <input value={form.codeBarre} onChange={(e) => setForm({ ...form, codeBarre: e.target.value })} />
                </FormField>
              )}
              <FormField label={t("common.active", "Actif")}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
                  <input type="checkbox" style={{ width: "auto" }} checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
                  {t("common.active", "Actif")}
                </label>
              </FormField>
            </FormGrid>
          </form>
        </Modal>
      )}
    </>
  );
}
