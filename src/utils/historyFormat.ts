/** Libellés FR pour les actions d’`history_logs` (aligné sur `HISTORY_ACTION`). */
export function labelHistoryAction(action: string | null | undefined): string {
  if (!action) return '—'
  if (action.startsWith('folder_step.created:')) {
    const rest = action.slice('folder_step.created:'.length)
    return `Étape dossier (${rest || 'détail'})`
  }
  const map: Record<string, string> = {
    'document.uploaded': 'Document importé',
    'document.validated': 'Document validé',
    'document.signature_requested': 'Signature demandée (Yousign)',
    'sinister.created': 'Sinistre créé',
    'sinister.updated': 'Sinistre modifié',
    'sinister.validated': 'Sinistre validé (gestionnaire)',
    'folder.created': 'Dossier créé',
    'folder.assigned': 'Chargé de suivi affecté',
    'folder.scenario_set': 'Scénario dossier défini (réparable / perte totale)',
    'folder.closed': 'Dossier clôturé',
    'user.created': 'Utilisateur créé',
    'user.updated': 'Utilisateur modifié',
    'user.deactivated': 'Utilisateur désactivé',
    'user.activated': 'Utilisateur réactivé',
    'user.deleted': 'Utilisateur supprimé'
  }
  return map[action] ?? action
}
