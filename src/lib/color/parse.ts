// CSS color parser.
//
// Parser shape inspired by Servo's `components/style/color/parsing.rs`
// (MPL 2.0), reduced to the subset we need: hex, named colors, and
// the modern function-syntax colors used in CSS Color 4. We deliberately
// skip relative-color syntax, calc() inside channels, hwb(), lab()/lch().

import type { Color, ColorSpace, Components } from './types'
import { ColorParseError, makeColor } from './types'
import { NAMED_COLORS } from './named'

const NONE_TOKEN = 'none'

/** Parse any supported CSS color string. */
export function parseColor(input: string): Color {
  const trimmed = input.trim()
  if (!trimmed) throw new ColorParseError(input, 'empty input')

  if (trimmed === 'transparent') {
    return makeColor('srgb', [0, 0, 0], 0, { legacy: true })
  }

  if (trimmed.startsWith('#')) {
    return parseHex(input, trimmed)
  }

  const lower = trimmed.toLowerCase()
  if (lower in NAMED_COLORS) {
    const [r, g, b] = NAMED_COLORS[lower]
    return makeColor('srgb', [r / 255, g / 255, b / 255], 1, { legacy: true })
  }

  const fn = matchFunction(trimmed)
  if (!fn) throw new ColorParseError(input, 'not a recognized color syntax')

  switch (fn.name) {
    case 'rgb':
    case 'rgba':
      return parseRgb(input, fn.body)
    case 'hsl':
    case 'hsla':
      return parseHsl(input, fn.body)
    case 'oklch':
      return parseOklch(input, fn.body)
    case 'oklab':
      return parseOklab(input, fn.body)
    case 'color':
      return parseColorFn(input, fn.body)
    default:
      throw new ColorParseError(input, `unsupported function "${fn.name}()"`)
  }
}

interface FnMatch {
  name: string
  body: string
}

function matchFunction(s: string): FnMatch | null {
  const open = s.indexOf('(')
  const close = s.lastIndexOf(')')
  if (open < 0 || close < open) return null
  return {
    name: s.slice(0, open).trim().toLowerCase(),
    body: s.slice(open + 1, close).trim(),
  }
}

// ---------- hex ----------

function parseHex(input: string, trimmed: string): Color {
  const body = trimmed.slice(1)
  let r: number,
    g: number,
    b: number,
    a = 1

  const expand = (h: string) => parseInt(h + h, 16) / 255
  const byte = (h: string) => parseInt(h, 16) / 255

  if (body.length === 3) {
    r = expand(body[0])
    g = expand(body[1])
    b = expand(body[2])
  } else if (body.length === 4) {
    r = expand(body[0])
    g = expand(body[1])
    b = expand(body[2])
    a = expand(body[3])
  } else if (body.length === 6) {
    r = byte(body.slice(0, 2))
    g = byte(body.slice(2, 4))
    b = byte(body.slice(4, 6))
  } else if (body.length === 8) {
    r = byte(body.slice(0, 2))
    g = byte(body.slice(2, 4))
    b = byte(body.slice(4, 6))
    a = byte(body.slice(6, 8))
  } else {
    throw new ColorParseError(
      input,
      `hex must be 3, 4, 6, or 8 digits, got ${body.length}`,
    )
  }

  if ([r, g, b, a].some(Number.isNaN)) {
    throw new ColorParseError(input, 'hex contains non-hex characters')
  }

  return makeColor('srgb', [r, g, b], a, { legacy: true })
}

// ---------- function-syntax helpers ----------

function splitChannels(body: string): { channels: string[]; alpha?: string } {
  if (body.includes('/')) {
    const [left, right] = body.split('/')
    if (left == null || right == null) throw new Error('bad / split')
    return { channels: tokenize(left), alpha: right.trim() }
  }
  if (body.includes(',')) {
    const parts = body.split(',').map((p) => p.trim())
    if (parts.length === 4) {
      return { channels: parts.slice(0, 3), alpha: parts[3] }
    }
    return { channels: parts }
  }
  return { channels: tokenize(body) }
}

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean)
}

interface ParsedChannel {
  value: number
  missing: boolean
}

function parseNumber(
  token: string,
  ctx: { input: string; channel: string },
): ParsedChannel {
  if (token === NONE_TOKEN) return { value: NaN, missing: true }
  const num = Number(token)
  if (!Number.isFinite(num)) {
    throw new ColorParseError(
      ctx.input,
      `expected number for ${ctx.channel}, got "${token}"`,
    )
  }
  return { value: num, missing: false }
}

function parsePercent(
  token: string,
  scale: number,
  ctx: { input: string; channel: string },
): ParsedChannel {
  if (token === NONE_TOKEN) return { value: NaN, missing: true }
  if (!token.endsWith('%')) {
    throw new ColorParseError(
      ctx.input,
      `expected percent for ${ctx.channel}, got "${token}"`,
    )
  }
  const num = Number(token.slice(0, -1))
  if (!Number.isFinite(num)) {
    throw new ColorParseError(
      ctx.input,
      `bad percent for ${ctx.channel}: "${token}"`,
    )
  }
  return { value: (num / 100) * scale, missing: false }
}

function parseNumberOrPercent(
  token: string,
  scale: number,
  ctx: { input: string; channel: string },
): ParsedChannel {
  if (token.endsWith('%')) return parsePercent(token, scale, ctx)
  return parseNumber(token, ctx)
}

function parseHue(
  token: string,
  ctx: { input: string; channel: string },
): ParsedChannel {
  if (token === NONE_TOKEN) return { value: NaN, missing: true }
  let value: number
  if (token.endsWith('deg')) value = Number(token.slice(0, -3))
  else if (token.endsWith('rad'))
    value = (Number(token.slice(0, -3)) * 180) / Math.PI
  else if (token.endsWith('grad')) value = Number(token.slice(0, -4)) * 0.9
  else if (token.endsWith('turn')) value = Number(token.slice(0, -4)) * 360
  else value = Number(token)
  if (!Number.isFinite(value)) {
    throw new ColorParseError(ctx.input, `bad hue: "${token}"`)
  }
  return { value, missing: false }
}

function parseAlpha(
  token: string | undefined,
  input: string,
): { alpha: number; missing: boolean } {
  if (token == null) return { alpha: 1, missing: false }
  const t = token.trim()
  if (t === NONE_TOKEN) return { alpha: NaN, missing: true }
  if (t.endsWith('%')) {
    const n = Number(t.slice(0, -1))
    if (!Number.isFinite(n))
      throw new ColorParseError(input, `bad alpha: "${token}"`)
    return { alpha: n / 100, missing: false }
  }
  const n = Number(t)
  if (!Number.isFinite(n))
    throw new ColorParseError(input, `bad alpha: "${token}"`)
  return { alpha: n, missing: false }
}

// ---------- rgb() ----------

function parseRgb(input: string, body: string): Color {
  const { channels, alpha } = splitChannels(body)
  if (channels.length !== 3) {
    throw new ColorParseError(
      input,
      `rgb() needs 3 channels, got ${channels.length}`,
    )
  }
  const ctx = (channel: string) => ({ input, channel })
  const r = parseNumberOrPercent(channels[0], 255, ctx('r'))
  const g = parseNumberOrPercent(channels[1], 255, ctx('g'))
  const b = parseNumberOrPercent(channels[2], 255, ctx('b'))
  const a = parseAlpha(alpha, input)
  const components: Components = [r.value / 255, g.value / 255, b.value / 255]
  return makeColor('srgb', components, a.alpha, {
    legacy: true,
    missing: { c0: r.missing, c1: g.missing, c2: b.missing, alpha: a.missing },
  })
}

// ---------- hsl() ----------

function parseHsl(input: string, body: string): Color {
  const { channels, alpha } = splitChannels(body)
  if (channels.length !== 3) {
    throw new ColorParseError(
      input,
      `hsl() needs 3 channels, got ${channels.length}`,
    )
  }
  const ctx = (channel: string) => ({ input, channel })
  const h = parseHue(channels[0], ctx('h'))
  const s = parsePercent(channels[1], 100, ctx('s'))
  const l = parsePercent(channels[2], 100, ctx('l'))
  const a = parseAlpha(alpha, input)
  return makeColor('hsl', [h.value, s.value, l.value], a.alpha, {
    legacy: true,
    missing: { c0: h.missing, c1: s.missing, c2: l.missing, alpha: a.missing },
  })
}

// ---------- oklch() ----------

function parseOklch(input: string, body: string): Color {
  const { channels, alpha } = splitChannels(body)
  if (channels.length !== 3) {
    throw new ColorParseError(input, `oklch() needs 3 channels`)
  }
  const ctx = (channel: string) => ({ input, channel })
  const l = parseNumberOrPercent(channels[0], 1, ctx('L'))
  const c = parseNumberOrPercent(channels[1], 0.4, ctx('C')) // 100% = 0.4 chroma
  const h = parseHue(channels[2], ctx('H'))
  const a = parseAlpha(alpha, input)
  return makeColor('oklch', [l.value, c.value, h.value], a.alpha, {
    missing: { c0: l.missing, c1: c.missing, c2: h.missing, alpha: a.missing },
  })
}

// ---------- oklab() ----------

function parseOklab(input: string, body: string): Color {
  const { channels, alpha } = splitChannels(body)
  if (channels.length !== 3) {
    throw new ColorParseError(input, `oklab() needs 3 channels`)
  }
  const ctx = (channel: string) => ({ input, channel })
  const l = parseNumberOrPercent(channels[0], 1, ctx('L'))
  const a = parseNumberOrPercent(channels[1], 0.4, ctx('a'))
  const b = parseNumberOrPercent(channels[2], 0.4, ctx('b'))
  const alph = parseAlpha(alpha, input)
  return makeColor('oklab', [l.value, a.value, b.value], alph.alpha, {
    missing: {
      c0: l.missing,
      c1: a.missing,
      c2: b.missing,
      alpha: alph.missing,
    },
  })
}

// ---------- color(srgb …), color(display-p3 …), color(srgb-linear …) ----------

const COLOR_FN_SPACES: Record<string, ColorSpace> = {
  srgb: 'srgb',
  'srgb-linear': 'srgb-linear',
  'display-p3': 'display-p3',
  // Not in the CSS color() spec, but accepted so a round-trip through
  // `toCss` / `parseColor` for linear-light Display-P3 works.
  'display-p3-linear': 'display-p3-linear',
  'xyz-d65': 'xyz-d65',
  xyz: 'xyz-d65',
}

function parseColorFn(input: string, body: string): Color {
  const { channels, alpha } = splitChannels(body)
  if (channels.length < 4) {
    throw new ColorParseError(input, 'color() needs a space and 3 channels')
  }
  const spaceTok = channels[0].toLowerCase()
  const space = COLOR_FN_SPACES[spaceTok]
  if (!space)
    throw new ColorParseError(input, `unsupported color() space "${spaceTok}"`)

  const ctx = (channel: string) => ({ input, channel })
  const c0 = parseNumberOrPercent(channels[1], 1, ctx('c0'))
  const c1 = parseNumberOrPercent(channels[2], 1, ctx('c1'))
  const c2 = parseNumberOrPercent(channels[3], 1, ctx('c2'))
  const a = parseAlpha(alpha, input)
  return makeColor(space, [c0.value, c1.value, c2.value], a.alpha, {
    missing: {
      c0: c0.missing,
      c1: c1.missing,
      c2: c2.missing,
      alpha: a.missing,
    },
  })
}
