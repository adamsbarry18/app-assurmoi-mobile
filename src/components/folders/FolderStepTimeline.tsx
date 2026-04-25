import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, useTheme } from 'react-native-paper'
import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import type { FolderStepRow } from '@/types/claims'
import { formatDate, labelFolderStepType } from '@/utils/claimFormat'
import { BrandColors } from '@/constants/brand'
import type { AuthUser } from '@/auth/types'

type StepUser = NonNullable<FolderStepRow['performedBy']>

function displayUser(u: StepUser | AuthUser): string {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (n) return `${n} — ${u.email}`
  return u.email || u.username
}

function stepIconName(stepType: string | null | undefined): keyof typeof MaterialCommunityIcons.glyphMap {
  const t = (stepType ?? '').toUpperCase()
  if (t.includes('RIB') || t.includes('S2_RIB')) return 'bank-outline'
  if (t.includes('EXPERT')) return 'file-chart-outline'
  if (t.includes('INVOICE') || t.includes('FACTURE')) return 'receipt'
  if (t.includes('ECHEANCE') || t.includes('CONVOCATION')) return 'clock-outline'
  if (t.includes('REGLEMENT') || t.includes('INDEMNISATION')) return 'cash'
  if (t.includes('REFACTURATION')) return 'account-switch'
  return 'timeline-check-outline'
}

type Props = {
  steps: FolderStepRow[] | undefined
}

/**
 * Fila verticale type « suivi d’opération » (apps banque / livraison), pas une liste de cartes.
 */
function parseActionDate(s: FolderStepRow): number {
  const t = s.action_date != null ? Date.parse(s.action_date) : NaN
  return Number.isNaN(t) ? 0 : t
}

export function FolderStepTimeline({ steps }: Props) {
  const theme = useTheme()
  const router = useRouter()
  const list = useMemo(() => {
    const arr = [...(steps ?? [])]
    arr.sort((a, b) => parseActionDate(a) - parseActionDate(b))
    return arr
  }, [steps])
  if (list.length === 0) {
    return (
      <View
        style={{
          paddingVertical: 32,
          paddingHorizontal: 8,
          alignItems: 'center'
        }}
      >
        <MaterialCommunityIcons
          name="timeline-text-outline"
          size={40}
          color={theme.colors.outline}
        />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
          Aucune étape pour l’instant.
        </Text>
      </View>
    )
  }

  return (
    <View style={{ paddingVertical: 4 }}>
      {list.map((s, i) => {
        const docId = s.document_id ?? s.document?.id
        return (
          <View key={s.id} style={{ flexDirection: 'row', minHeight: 72 }}>
            <View style={{ width: 36, alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1
                }}
              >
                <MaterialCommunityIcons
                  name={stepIconName(s.step_type)}
                  size={20}
                  color={BrandColors.primary}
                />
              </View>
              {i < list.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    backgroundColor: theme.colors.outlineVariant,
                    marginTop: 2
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingLeft: 4, paddingBottom: 20 }}>
              <Text variant="labelLarge" style={{ color: BrandColors.primary, fontWeight: '600' }}>
                {labelFolderStepType(s.step_type ?? undefined)}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
              >
                {formatDate(s.action_date)}
              </Text>
              {s.performedBy ? (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline, marginTop: 4 }}
                >
                  {displayUser(s.performedBy)}
                </Text>
              ) : null}
              {s.value ? (
                <Text variant="bodySmall" style={{ marginTop: 6, lineHeight: 20 }}>
                  {s.value}
                </Text>
              ) : null}
              {docId != null ? (
                <Pressable
                  onPress={() => router.push(`/document/${docId}` as Href)}
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name="paperclip"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                      Document
                      {s.document?.is_validated === false ? ' (à valider)' : ''} · n°{docId}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
