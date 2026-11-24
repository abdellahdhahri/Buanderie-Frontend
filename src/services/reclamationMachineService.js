import { lireErreur } from "./integrationService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export const TYPES_RECLAMATION_MACHINE = [
  { value: "MACHINE_EN_PANNE", label: "En panne" },
  { value: "MACHINE_FUITE", label: "Fuite" },
  { value: "MACHINE_SURCHAUFFE", label: "Surchauffe" },
  { value: "MACHINE_BRUIT_ANORMAL", label: "Bruit anormal" },
  { value: "MACHINE_PORTE_BLOQUEE", label: "Porte bloquée" },
];

export const DESCRIPTION_MAX = 500;

export const ETATS_BLOQUANTS = ["EN_PANNE", "EN_COURS_DE_REPARATION"];

export const machineBloquee = (machine) => ETATS_BLOQUANTS.includes(machine?.etatTechnique);

export const libelleTypeMachine = (type) => TYPES_RECLAMATION_MACHINE.find((x) => x.value === type)?.label || type || "—";

export const estReclamationMachine = (r) => Boolean(r?.machine);

export async function declarerReclamationMachine({ codeMachine, type, matriculeAgent, description }) {
  const payload = { codeMachine, type, matriculeAgent };
  if (description && description.trim()) payload.description = description.trim();
  const response = await fetch(`${API_URL}/api/reclamations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await lireErreur(response, "Erreur lors de la déclaration"));
  return response.json();
}
