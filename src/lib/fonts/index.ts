import HKGroteskBold from './HKGrotesk-Bold.woff2'
import HKGroteskMedium from './HKGrotesk-Medium.woff2'
import HKGroteskMediumItalic from './HKGrotesk-MediumItalic.woff2'
import MerriweatherBold from './Merriweather-Bold.woff2'
import MerriweatherItalic from './Merriweather-Italic.woff2'
import MerriweatherRegular from './Merriweather-Regular.woff2'
import AzeretMonoRegular from './AzeretMono-Regular.woff2'
import AzeretMonoMedium from './AzeretMono-Medium.woff2'
import AzeretMonoBold from './AzeretMono-Bold.woff2'
import AzeretMonoMediumItalic from './AzeretMono-MediumItalic.woff2'

export interface FontMetadata {
  url: string
  family: string
  weight: number
  style: 'normal' | 'italic'
  filename: string
}

export const fonts = {
  hkGroteskBold: {
    url: HKGroteskBold,
    family: 'HK Grotesk',
    weight: 700,
    style: 'normal',
    filename: 'HKGrotesk-Bold',
  },
  hkGroteskMedium: {
    url: HKGroteskMedium,
    family: 'HK Grotesk',
    weight: 500,
    style: 'normal',
    filename: 'HKGrotesk-Medium',
  },
  hkGroteskMediumItalic: {
    url: HKGroteskMediumItalic,
    family: 'HK Grotesk',
    weight: 500,
    style: 'italic',
    filename: 'HKGrotesk-MediumItalic',
  },
  merriweatherBold: {
    url: MerriweatherBold,
    family: 'Merriweather',
    weight: 700,
    style: 'normal',
    filename: 'Merriweather-Bold',
  },
  merriweatherItalic: {
    url: MerriweatherItalic,
    family: 'Merriweather',
    weight: 400,
    style: 'italic',
    filename: 'Merriweather-Italic',
  },
  merriweatherRegular: {
    url: MerriweatherRegular,
    family: 'Merriweather',
    weight: 400,
    style: 'normal',
    filename: 'Merriweather-Regular',
  },
  azeretMonoRegular: {
    url: AzeretMonoRegular,
    family: 'Azeret Mono',
    weight: 400,
    style: 'normal',
    filename: 'AzeretMono-Regular',
  },
  azeretMonoMedium: {
    url: AzeretMonoMedium,
    family: 'Azeret Mono',
    weight: 500,
    style: 'normal',
    filename: 'AzeretMono-Medium',
  },
  azeretMonoBold: {
    url: AzeretMonoBold,
    family: 'Azeret Mono',
    weight: 700,
    style: 'normal',
    filename: 'AzeretMono-Bold',
  },
  azeretMonoMediumItalic: {
    url: AzeretMonoMediumItalic,
    family: 'Azeret Mono',
    weight: 500,
    style: 'italic',
    filename: 'AzeretMono-MediumItalic',
  },
} as const satisfies Record<string, FontMetadata>

export type FontKey = keyof typeof fonts

// Backward compatibility: array of URLs
export const fontUrls = Object.values(fonts).map((f) => f.url)

// Helper for font preloading
export interface FontPreloadProps {
  rel: 'preload'
  href: string
  as: 'font'
  type: 'font/woff2'
  crossOrigin: 'anonymous'
}

/**
 * Generate props for font preload link tags
 *
 * @example
 *   // Preload specific fonts
 *   const preloads = getFontPreloads([
 *     'hkGroteskBold',
 *     'merriweatherRegular',
 *   ])
 *
 *   // Preload all fonts
 *   const preloads = getFontPreloads()
 *
 * @param fontKeys - Optional array of font keys to preload. If not provided,
 *   returns all fonts.
 */
export function getFontPreloads(fontKeys?: FontKey[]): FontPreloadProps[] {
  const fontsToPreload = fontKeys
    ? fontKeys.map((key) => fonts[key])
    : Object.values(fonts)

  return fontsToPreload.map((font) => ({
    rel: 'preload',
    href: font.url,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  }))
}

// Default export for convenience
export default fonts
