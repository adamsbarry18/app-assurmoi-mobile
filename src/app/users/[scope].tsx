import { useLocalSearchParams } from 'expo-router'
import { UserDirectoryScreen } from '@/components/user-directory/UserDirectoryScreen'

/**
 * Annuaire utilisateurs : `/users/staff` (équipe) ou `/users/insured` (assurés).
 * Toute autre valeur de segment retombe sur la vue « équipe ».
 */
export default function UsersByScopeScreen() {
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string | string[] }>()
  const raw = Array.isArray(scopeParam) ? scopeParam[0] : scopeParam
  const userScope = raw === 'insured' ? 'insured' : 'staff'
  const screenTitle = userScope === 'insured' ? 'Assurés' : 'Équipe'

  return (
    <UserDirectoryScreen
      userScope={userScope}
      screenTitle={screenTitle}
      showInviteFab={userScope === 'staff'}
      showNewInsuredFab={userScope === 'insured'}
    />
  )
}
