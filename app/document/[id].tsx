import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper'
import { useAuth } from '@/features/auth'
import {
  fetchDocumentMeta,
  signDocumentYousign,
  validateDocumentApi,
  type DocumentMeta
} from '@/lib/documentsApi'
import { ApiRequestError } from '@/lib/apiErrors'
import { canRequestYousignSignature, canValidateDocument } from '@/lib/roleAccess'
import { formatDate } from '@/lib/claimFormat'
import { BrandColors } from '@/constants/brand'

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim()
  if (t === '') return undefined
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export default function DocumentDetailScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const { user, isReady } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [meta, setMeta] = useState<DocumentMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [signing, setSigning] = useState(false)
  const [lastSignatureLink, setLastSignatureLink] = useState<string | null>(null)

  const [signerFirst, setSignerFirst] = useState('')
  const [signerLast, setSignerLast] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [locale, setLocale] = useState('fr')
  const [requestName, setRequestName] = useState('')
  const [signPage, setSignPage] = useState('')
  const [signX, setSignX] = useState('')
  const [signY, setSignY] = useState('')
  const [showPlacement, setShowPlacement] = useState(false)

  const id = Number.parseInt(String(rawId), 10)

  const load = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) {
      setError('Identifiant document invalide')
      setMeta(null)
      return
    }
    setError(null)
    setInfo(null)
    setLastSignatureLink(null)
    setLoading(true)
    try {
      const res = await fetchDocumentMeta(id)
      setMeta(res.data)
    } catch (e) {
      setMeta(null)
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Chargement impossible (droits ou document absent).'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  const onValidate = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) return
    if (!user || !canValidateDocument(user.role)) return
    setValidating(true)
    setError(null)
    setInfo(null)
    try {
      const res = await validateDocumentApi(id)
      setInfo(res.message ?? 'Document validé.')
      if (res.data) {
        setMeta((m) => (m ? { ...m, is_validated: true } : m))
      } else {
        await load()
      }
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Validation impossible.')
    } finally {
      setValidating(false)
    }
  }, [id, user, load])

  const onSignYousign = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) return
    if (!user || !canRequestYousignSignature(user.role)) return
    const fn = signerFirst.trim()
    const ln = signerLast.trim()
    const em = signerEmail.trim()
    if (!fn || !ln || !em) {
      setError('Indiquez le prénom, le nom et l’e-mail du signataire.')
      return
    }
    setSigning(true)
    setError(null)
    setInfo(null)
    setLastSignatureLink(null)
    try {
      const res = await signDocumentYousign(id, {
        first_name: fn,
        last_name: ln,
        email: em,
        locale: locale.trim() || 'fr',
        signature_request_name: requestName.trim() || undefined,
        sign_page: parseOptionalInt(signPage),
        sign_x: parseOptionalInt(signX),
        sign_y: parseOptionalInt(signY)
      })
      const link = res.data.signature_link ?? null
      setLastSignatureLink(link)
      setInfo(
        link
          ? 'Demande Yousign créée. Ouvrez le lien pour faire signer le document.'
          : 'Demande Yousign créée. Consultez Yousign ou l’historique pour le lien de signature.'
      )
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Signature Yousign impossible.')
    } finally {
      setSigning(false)
    }
  }, [id, user, signerFirst, signerLast, signerEmail, locale, requestName, signPage, signX, signY])

  const openSignatureLink = useCallback(async () => {
    if (!lastSignatureLink) return
    try {
      await WebBrowser.openBrowserAsync(lastSignatureLink)
    } catch {
      setError('Ouverture du lien impossible.')
    }
  }, [lastSignatureLink])

  useEffect(() => {
    if (!user) return
    setSignerFirst((v) => v || user.first_name || '')
    setSignerLast((v) => v || user.last_name || '')
    setSignerEmail((v) => v || user.email || '')
  }, [user])

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meta ? `Document #${meta.id}` : 'Document',
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: BrandColors.primary
    })
  }, [navigation, meta, theme.colors.surface])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  if (!user) return null

  const canValidate = canValidateDocument(user.role) && meta && !meta.is_validated
  const canYousign = canRequestYousignSignature(user.role) && meta?.is_validated === true

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text>
        ) : null}
        {info ? (
          <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{info}</Text>
        ) : null}

        {loading && !meta ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Chargement…
          </Text>
        ) : null}

        {meta ? (
          <Card mode="outlined" style={{ marginBottom: 12 }}>
            <Card.Content>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
              >
                Type
              </Text>
              <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                {meta.type}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}
              >
                Statut
              </Text>
              <Text
                variant="bodyLarge"
                style={{
                  fontWeight: '600',
                  color: meta.is_validated ? theme.colors.primary : theme.colors.onSurface
                }}
              >
                {meta.is_validated ? 'Validé' : 'En attente de validation interne'}
              </Text>
              {meta.uploaded_at ? (
                <>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}
                  >
                    Import
                  </Text>
                  <Text variant="bodyMedium">{formatDate(meta.uploaded_at)}</Text>
                </>
              ) : null}
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, lineHeight: 20 }}
              >
                La prévisualisation du fichier n’est pas disponible dans l’application ; le fichier
                est accessible sur le back-office ou via l’URL technique une fois le document connu
                côté serveur.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {canValidate ? (
          <Button
            mode="contained"
            buttonColor={BrandColors.primary}
            onPress={onValidate}
            loading={validating}
            disabled={validating}
            style={{ borderRadius: 10, marginTop: 8 }}
          >
            Valider le document
          </Button>
        ) : null}

        {canYousign ? (
          <Card mode="outlined" style={{ marginTop: 16 }}>
            <Card.Content>
              <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                Signature électronique (Yousign)
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, lineHeight: 20 }}
              >
                Réservé aux formats PDF ou DOCX côté serveur. Les images doivent être converties
                avant envoi.
              </Text>
              <TextInput
                label="Prénom du signataire *"
                value={signerFirst}
                onChangeText={setSignerFirst}
                mode="outlined"
                style={{ marginBottom: 10 }}
                autoCapitalize="words"
              />
              <TextInput
                label="Nom du signataire *"
                value={signerLast}
                onChangeText={setSignerLast}
                mode="outlined"
                style={{ marginBottom: 10 }}
                autoCapitalize="words"
              />
              <TextInput
                label="E-mail du signataire *"
                value={signerEmail}
                onChangeText={setSignerEmail}
                mode="outlined"
                style={{ marginBottom: 10 }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
              <TextInput
                label="Locale (ex. fr)"
                value={locale}
                onChangeText={setLocale}
                mode="outlined"
                style={{ marginBottom: 10 }}
              />
              <TextInput
                label="Nom interne de la demande (optionnel)"
                value={requestName}
                onChangeText={setRequestName}
                mode="outlined"
                style={{ marginBottom: 10 }}
              />
              <Button
                mode="text"
                onPress={() => setShowPlacement((s) => !s)}
                style={{ alignSelf: 'flex-start', marginBottom: showPlacement ? 8 : 0 }}
              >
                {showPlacement
                  ? 'Masquer le placement du champ signature'
                  : 'Placement du champ signature (optionnel)'}
              </Button>
              {showPlacement ? (
                <View style={{ marginBottom: 10 }}>
                  <TextInput
                    label="Page (≥ 1)"
                    value={signPage}
                    onChangeText={setSignPage}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={{ marginBottom: 8 }}
                  />
                  <TextInput
                    label="Position X"
                    value={signX}
                    onChangeText={setSignX}
                    mode="outlined"
                    keyboardType="number-pad"
                    style={{ marginBottom: 8 }}
                  />
                  <TextInput
                    label="Position Y"
                    value={signY}
                    onChangeText={setSignY}
                    mode="outlined"
                    keyboardType="number-pad"
                  />
                </View>
              ) : null}
              <Button
                mode="contained"
                buttonColor={BrandColors.primary}
                onPress={onSignYousign}
                loading={signing}
                disabled={signing}
                style={{ borderRadius: 10, marginTop: 8 }}
              >
                Lancer la demande Yousign
              </Button>
              {lastSignatureLink ? (
                <Button
                  mode="outlined"
                  onPress={() => void openSignatureLink()}
                  style={{ marginTop: 10, borderRadius: 10 }}
                >
                  Ouvrir le lien de signature
                </Button>
              ) : null}
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
