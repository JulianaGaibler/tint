export interface PaletteColors {
  bg: string
  'bg-secondary': string
  text: string
  'text-secondary': string
  'text-accent': string
  'text-link': string
  'action-primary': string
  'action-primary-text': string
  'action-primary-hover': string
  'action-primary-active': string
  'action-secondary': string
  'action-secondary-text': string
  'action-secondary-hover': string
  'action-secondary-active': string
  'input-bg': string
}

export interface GeneralColors {
  'card-border': string
  'card-shadow': string
}

export interface ColorPalette {
  plain: PaletteColors
  tint: PaletteColors
  general: GeneralColors
}

export interface ColorPaletteWithDark extends ColorPalette {
  dark?: ColorPalette
}

export interface PresetPalette {
  name: string
  colors: ColorPalette
  dark?: ColorPalette
}

export type ColorFormat = 'hex' | 'rgb' | 'oklch'
