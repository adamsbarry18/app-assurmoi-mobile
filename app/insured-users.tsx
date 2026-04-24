import { UserDirectoryScreen } from '@/components/user-directory/UserDirectoryScreen'

/** Assurés + invitations au rôle assuré ; création fiche via FAB. */
export default function InsuredUsersScreen() {
  return <UserDirectoryScreen userScope="insured" screenTitle="Assurés" showNewInsuredFab />
}
