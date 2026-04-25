import { labelFolderStepType } from '@/utils/claimFormat'

/** Libellés FR pour l’historique (texte affiché à l’utilisateur, sans jargon technique). */
export function labelHistoryAction(action: string | null | undefined): string {
  if (!action) return '—'
  if (action.startsWith('folder_step.created:')) {
    const rest = action.slice('folder_step.created:'.length)
    return `Étape ajoutée : ${labelFolderStepType(rest) || 'détail'}`
  }
  const map: Record<string, string> = {
    'document.uploaded': 'Document importé',
    'document.validated': 'Document validé',
    'document.signature_requested': 'Demande de signature électronique envoyée',
    'sinister.created': 'Sinistre créé',
    'sinister.updated': 'Sinistre modifié',
    'sinister.validated': 'Sinistre validé par l’assureur',
    'folder.created': 'Dossier créé',
    'folder.assigned': 'Chargé de suivi affecté',
    'folder.scenario_set': 'Scénario du dossier défini (réparable ou perte totale)',
    'folder.closed': 'Dossier clôturé',
    'user.created': 'Utilisateur créé',
    'user.updated': 'Utilisateur modifié',
    'user.deactivated': 'Utilisateur désactivé',
    'user.activated': 'Utilisateur réactivé',
    'user.deleted': 'Utilisateur supprimé'
  }
  return map[action] ?? 'Événement enregistré'
}
