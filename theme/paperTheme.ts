import { MD3LightTheme, type MD3Theme } from 'react-native-paper'
import { BrandColors } from '@/constants/brand'

/**
 * Thème proche des applications assurance (fonds clairs, bleu de confiance, accents sobres).
 */
export const assurMoiLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BrandColors.primary,
    primaryContainer: '#E3F2FD',
    onPrimary: '#FFFFFF',
    secondary: '#00695C',
    secondaryContainer: '#B2DFDB',
    surface: '#F8FAFC',
    surfaceVariant: '#ECEFF1',
    background: '#FFFFFF',
    error: '#B71C1C',
    outline: '#B0BEC5'
  }
}
