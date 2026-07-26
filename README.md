# tint

Tint is a design foundation for Svelte and Astro projects, providing components, fonts, icons, and styles.

## Installation

```bash
npm install tint
```

## Documentation

For complete documentation, configuration guides, and component examples, see the Storybook documentation.

## What's Included

- **Components**: Button, TextField, Select, Slider, Modal, and more (Svelte 5)
- **Fonts**: HK Grotesk (sans-serif) and Merriweather (serif) in WOFF2 format
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
import { Button } from 'tint'                      // Components
import { getFontPreloads } from 'tint/fonts'       // Fonts
import { tooltip } from 'tint/actions'             // Actions
import { createRadioGroup } from 'tint/stores'     // Stores
import icon from 'tint/icons/20-add.svg'           // Icons
import 'tint/styles/bootstrap.sass'                // Styles
```
