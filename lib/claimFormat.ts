/** Libellé FR pour le statut calculé côté API (sinistres) */
export function labelSinisterStatus(status: string | undefined): string {
  if (!status) return '—'
  if (status === 'pending_validation') return 'En attente de validation'
  if (status === 'validated') return 'Validé (sans dossier ou dossier en cours de création)'
  const m = status.match(/^FOLDER_(.+)$/)
  if (m) {
    const s = m[1]
    const map: Record<string, string> = {
      INITIALIZED: 'Dossier initialisé',
      EXPERTISE_PENDING: 'Expertise en attente',
      REPAIR_PLANNED: 'Réparation planifiée',
      COMPENSATION_PENDING: 'Indemnisation en cours',
      CLOSED: 'Dossier clos'
    }
    return `Dossier : ${map[s] ?? s}`
  }
  return status
}

export function labelFolderStatus(s: string | undefined | null): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    INITIALIZED: 'Initialisé',
    EXPERTISE_PENDING: 'Expertise en attente',
    REPAIR_PLANNED: 'Réparation planifiée',
    COMPENSATION_PENDING: 'Indemnisation',
    CLOSED: 'Clos'
  }
  return map[s] ?? s
}

export function labelScenario(s: string | undefined | null): string {
  if (s === 'REPAIRABLE') return 'Véhicule réparable'
  if (s === 'TOTAL_LOSS') return 'Perte totale / indemnisation'
  return s ?? '—'
}

/** Types d’étape alignés sur `folderWorkflow` (API) */
export const FOLDER_STEP_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'S1_EXPERT_REPORT', label: 'Rapport d’expertise (réparable)' },
  { value: 'S1_INVOICE', label: 'Facture / devis atelier (réparable)' },
  { value: 'S2_RIB', label: 'RIB — perte totale (doc validé ou dépôt assuré)' },
  { value: 'PAYMENT_SETTLED', label: 'Règlement / indemnisation constaté' },
  { value: 'THIRD_PARTY_REBILLING_CONFIRMED', label: 'Refacturation tiers — confirmée' },
  { value: 'EXPERTISE_ECHEANCE', label: 'Échéance — expertise / convocation' },
  { value: 'GENERIC_ECHEANCE', label: 'Échéance / relance (autre)' }
]

export function labelFolderStepType(code: string | undefined | null): string {
  if (!code) return '—'
  return FOLDER_STEP_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code
}

/** Types document API attendus pour les étapes structurées (`folderWorkflow.STEP_DOCUMENT_BY_SCENARIO`). */
export type FolderStepLinkedDocumentApiType = 'EXPERT_REPORT' | 'INVOICE' | 'RIB'

export function labelLinkedDocumentTypeForStep(apiType: FolderStepLinkedDocumentApiType): string {
  const m: Record<FolderStepLinkedDocumentApiType, string> = {
    EXPERT_REPORT: 'rapport d’expertise (EXPERT_REPORT)',
    INVOICE: 'facture / devis atelier (INVOICE)',
    RIB: 'RIB'
  }
  return m[apiType]
}

/**
 * Indique si l’étape exige un `document_id` (et le type métier attendu côté API).
 * Doit rester aligné sur `services/folderWorkflow.js` (STEP_DOCUMENT_BY_SCENARIO).
 */
export function folderStepLinkedDocumentRule(
  stepType: string,
  scenario: string | null | undefined
):
  | { required: false }
  | { required: true; apiDocumentType: FolderStepLinkedDocumentApiType } {
  if (!scenario) return { required: false }
  if (scenario === 'REPAIRABLE') {
    if (stepType === 'S1_EXPERT_REPORT') {
      return { required: true, apiDocumentType: 'EXPERT_REPORT' }
    }
    if (stepType === 'S1_INVOICE') {
      return { required: true, apiDocumentType: 'INVOICE' }
    }
  }
  if (scenario === 'TOTAL_LOSS' && stepType === 'S2_RIB') {
    return { required: true, apiDocumentType: 'RIB' }
  }
  return { required: false }
}

/** N’affiche que les types d’étape cohérents avec le scénario (évite ex. S2_RIB en réparable). */
export function folderStepTypeOptionsForScenario(
  scenario: string | null | undefined
): { value: string; label: string }[] {
  if (!scenario) return FOLDER_STEP_TYPE_OPTIONS
  if (scenario === 'REPAIRABLE') {
    return FOLDER_STEP_TYPE_OPTIONS.filter((o) => o.value !== 'S2_RIB')
  }
  if (scenario === 'TOTAL_LOSS') {
    return FOLDER_STEP_TYPE_OPTIONS.filter(
      (o) => o.value !== 'S1_EXPERT_REPORT' && o.value !== 'S1_INVOICE'
    )
  }
  return FOLDER_STEP_TYPE_OPTIONS
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}
