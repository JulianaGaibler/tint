# tint

Tint is a design foundation for Svelte and Astro projects, providing components, fonts, icons, and styles.

## Installation

```bash
npm install @julianagaibler/tint
```

## Documentation

For complete documentation, configuration guides, and component examples, see the Storybook documentation.

## What's Included

- **Components**: Button, TextField, Select, Slider, Modal, and more (Svelte 5)
- **Fonts**: HK Grotesk (sans-serif), Merriweather (serif) and Azeret Mono (monospace) in WOFF2 format
- **Icons**: 90+ SVG icons in 14px and 20px sizes
- **Styles**: SASS mixins for typography, colors, and utilities
- **Theming**: Colors and dimensions (roundness, spacing, border width) are
  exposed as CSS custom properties you can override at runtime
- **Actions**: Svelte actions (tooltip, reorderable)
- **Stores**: Form control helpers (radio groups, checkbox groups)

## Customization

Override theming tokens in your own CSS — no SASS or rebuild required:

```css
:root {
  --tint-radius-input: 4px; /* input/select roundness */
  --tint-radius-button: 4px; /* button roundness */
  --tint-radius-card: 8px; /* card/toast roundness */
  --tint-font-sans: 'Inter', sans-serif; /* swap fonts */
  --tint-font-serif: 'Lora', serif;
}
```

To use your own fonts, override the font variables and skip tint's bundled
`@font-face` with `full-bootstrap($include-font-faces: false)`. See the "Getting
Started / Styles" and "Fonts" pages in Storybook for the full token list.

## Import Paths

```javascript
import { Button } from '@julianagaibler/tint'                      // Components
import { getFontPreloads } from '@julianagaibler/tint/fonts'       // Fonts
import { tooltip } from '@julianagaibler/tint/actions'             // Actions
import { createRadioGroup } from '@julianagaibler/tint/stores'     // Stores
import icon from '@julianagaibler/tint/icons/20-add.svg'           // Icons
import '@julianagaibler/tint/styles/bootstrap.sass'                // Styles
```

## License

Tint is released under the MIT license. The bundled fonts are licensed under the SIL Open Font License, and each license file ships next to its font in `fonts/`.
