import { UserDirectoryScreen } from '@/components/user-directory/UserDirectoryScreen'

/** Comptes équipe (gestionnaires, admin, chargés) + invitations hors assurés. */
export default function AdminUsersScreen() {
  return <UserDirectoryScreen userScope="staff" screenTitle="Équipe" showInviteFab />
}
