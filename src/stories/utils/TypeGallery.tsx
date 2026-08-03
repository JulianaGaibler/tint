import { CopyIcon } from '@storybook/icons'
import { styled, type Theme } from 'storybook/theming'
import type { FC } from 'react'
import React from 'react'
import { typeDefinitons } from 'virtual:typography-importer'
import { type TypeDefinition } from '../../../scripts/typography-importer'

const GalleryWrapper = styled.div((_) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
}))
const Gallery = styled.ul((_) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gridGap: '1rem',
  listStyle: 'none',
  padding: 0,
  margin: 0,
}))

const sharedButtonBubble = (theme: Theme) => ({
  margin: 0,
  padding: '4px 8px',
  borderRadius: `4px`,
  color: theme.color.defaultText,
  fontSize: '.8rem',
  lineHeight: '16px',
  fontFamily: theme.typography.fonts.base,
  fontWeight: theme.typography.weight.bold,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const DefinitionElement = styled.li(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  borderRadius: theme.appBorderRadius,
  background: theme.background.app,
  padding: '1rem',
  gap: '1rem',
  ' > div.info': {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
  },
  ' > div.info > h3': {
    margin: 0,
  },
}))

// Label colors. Neutral matches the category chip; the typeface (letterform)
// and italic get distinct hues so the three families read at a glance.
const chipColors = {
  neutral: '#4E4C62',
  serif: '#E8730C',
  sans: '#864FFF',
  mono: '#00976D',
  italic: '#007AFF',
}

const Attributes = styled.div(({ theme }) => ({
  display: 'flex',
  gap: '0.2rem',
  ' > div': {
    ...sharedButtonBubble(theme),
    border: `1px solid ${theme.appBorderColor}`,
    background: theme.background.content,
    borderColor: 'currentColor',
    color: chipColors.neutral,
  },
  // Typeface leads each row, one color per family
  '.letterform--serif': { color: chipColors.serif },
  '.letterform--sans': { color: chipColors.sans },
  '.letterform--mono': { color: chipColors.mono },
  // Italic stands out; bold and the rest stay neutral
  '.modifier--italic': { color: chipColors.italic },
}))

const SearchInput = styled.input(({ theme }) => ({
  marginBlock: '1rem',
  padding: '0.5rem 1rem',
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: '64px',
  background: theme.background.content,
  color: theme.color.defaultText,
  fontFamily: theme.typography.fonts.base,
  fontSize: '1rem',
  lineHeight: '1.5rem',
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out',
  '&:focus': {
    borderColor: theme.color.secondary,
  },
}))

// Typeface filter, styled after tint's SegmentedControl: a rounded pill track
// with the active segment filled in the accent color.
const FilterBar = styled.div(({ theme }) => ({
  display: 'flex',
  gap: '0.25rem',
  alignSelf: 'flex-start',
  padding: '0.25rem',
  marginBlockStart: '1rem',
  borderRadius: '999px',
  background: theme.background.app,
  border: `1px solid ${theme.appBorderColor}`,
}))
const FilterButton = styled.button(({ theme }) => ({
  border: 'none',
  cursor: 'pointer',
  borderRadius: '999px',
  padding: '0.35rem 0.9rem',
  background: 'transparent',
  color: theme.color.defaultText,
  fontFamily: theme.typography.fonts.base,
  fontSize: '0.85rem',
  fontWeight: theme.typography.weight.bold,
  transition: 'background 0.15s ease-in-out, color 0.15s ease-in-out',
  '&:hover': {
    background: theme.background.hoverable,
  },
  '&.selected': {
    background: theme.color.secondary,
    color: theme.color.lightest,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.color.secondary}`,
    outlineOffset: 2,
  },
}))

const CopyButton = styled.button(({ theme }) => ({
  ...sharedButtonBubble(theme),
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  gap: '0.4rem',
  fontFamily: theme.typography.fonts.mono,
  paddingInlineStart: 2,
  textAlign: 'start',
  '&:hover': {
    background: theme.background.hoverable,
  },

  transition: 'background 0.2s ease-in-out, color 0.2s ease-in-out',
  '&.copied': {
    background: theme.color.positive,
    color: theme.color.lightest,
    transition: 'none',
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.color.secondary}`,
  },
}))

const TypePreview = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: theme.appBorderRadius,
  background: theme.background.content,
  border: `1px solid ${theme.appBorderColor}`,
  // no wrap
  whiteSpace: 'nowrap',
  minHeight: '64px',
  flex: 0.7,
  overflow: 'hidden',
  padding: '.75rem',
  userSelect: 'none',
}))

const TypeDefItem: FC<{
  definition: TypeDefinition
  showLetterform: boolean
}> = ({ definition, showLetterform }) => {
  function copyClass(e: React.MouseEvent<HTMLButtonElement>) {
    const path = `tint--type-${definition.name}`
    // add the path to the clipboard
    navigator.clipboard.writeText(path)
    // add class 'copied' to the button
    const button = e.currentTarget
    button.classList.add('copied')
    // remove the class after 1 second
    setTimeout(() => button.classList.remove('copied'), 1000)
  }
  return (
    <DefinitionElement>
      <TypePreview
        aria-hidden="true"
        className={`tint--type-${definition.name}`}
      >
        The quick brown fox jumps over the lazy dog
      </TypePreview>
      <div className="info">
        <h3>{definition.name}</h3>
        <CopyButton onClick={copyClass}>
          <CopyIcon />
          tint--type-{definition.name}
        </CopyButton>
        <Attributes>
          {showLetterform && definition.letterform && (
            <div
              className={`letterform letterform--${definition.letterform.toLowerCase()}`}
            >
              {definition.letterform}
            </div>
          )}
          <div className="category">{definition.category}</div>
          {definition.modifier && (
            <div
              className={`modifier modifier--${definition.modifier.toLowerCase()}`}
            >
              {definition.modifier}
            </div>
          )}
          {definition.level && <div className="level">{definition.level}</div>}
          {definition.size && <div className="size">{definition.size}</div>}
        </Attributes>
      </div>
    </DefinitionElement>
  )
}

// Typeface filters. Utility styles (UI, Input, Action) carry no letterform but
// are sans-serif by design, so they fall under "Sans".
const TYPEFACE_FILTERS = ['All', 'Serif', 'Sans', 'Mono'] as const
type TypefaceFilter = (typeof TYPEFACE_FILTERS)[number]

// Within a category, cluster the three typefaces of a given variant together
// (e.g. all of "title 3", then all of "title 2") and order them sans → serif →
// mono, so the three columns line up in the grid. The variant order is taken
// from the definitions' first appearance, preserving the authored sequence.
const LETTERFORM_ORDER: Record<string, number> = { Sans: 0, Serif: 1, Mono: 2 }

function variantKey(def: TypeDefinition): string {
  return `${def.level ?? ''}|${def.size ?? ''}|${def.modifier ?? ''}`
}

function sortByVariantThenTypeface(defs: TypeDefinition[]): TypeDefinition[] {
  const variantOrder = new Map<string, number>()
  for (const def of defs) {
    const key = variantKey(def)
    if (!variantOrder.has(key)) variantOrder.set(key, variantOrder.size)
  }
  return [...defs].sort((a, b) => {
    const byVariant =
      variantOrder.get(variantKey(a))! - variantOrder.get(variantKey(b))!
    if (byVariant !== 0) return byVariant
    return (
      (LETTERFORM_ORDER[a.letterform ?? 'Sans'] ?? 0) -
      (LETTERFORM_ORDER[b.letterform ?? 'Sans'] ?? 0)
    )
  })
}

const TypeGallery: FC = () => {
  const [searchString, setSearchString] = React.useState('')
  const [typeface, setTypeface] = React.useState<TypefaceFilter>('All')

  const filteredDefs = React.useMemo(() => {
    const search = searchString.trim().toLowerCase()
    return typeDefinitons.reduce(
      (acc, item) => {
        const definitions = item.definitions.filter((definition) => {
          const matchesSearch =
            !search || definition.name.toLowerCase().includes(search)
          const letterform = definition.letterform ?? 'Sans'
          const matchesTypeface = typeface === 'All' || letterform === typeface
          return matchesSearch && matchesTypeface
        })
        if (definitions.length) {
          acc.push({
            ...item,
            definitions: sortByVariantThenTypeface(definitions),
          })
        }
        return acc
      },
      [] as typeof typeDefinitons,
    )
  }, [searchString, typeface])

  return (
    <GalleryWrapper>
      <FilterBar role="group" aria-label="Filter by typeface">
        {TYPEFACE_FILTERS.map((filter) => (
          <FilterButton
            key={filter}
            className={typeface === filter ? 'selected' : ''}
            aria-pressed={typeface === filter}
            onClick={() => setTypeface(filter)}
          >
            {filter}
          </FilterButton>
        ))}
      </FilterBar>
      <SearchInput
        type="text"
        placeholder="Search for type definitions"
        onChange={(e) => setSearchString(e.target.value)}
      />
      {/* first we create an h2 for the category name */}
      {filteredDefs.map(({ category, categoryTitle, definitions }) => (
        <React.Fragment key={category}>
          <h2>{categoryTitle}</h2>
          <Gallery className="docs-type">
            {definitions.map((definition) => (
              <TypeDefItem
                definition={definition}
                showLetterform={typeface === 'All'}
                key={definition.name}
              />
            ))}
          </Gallery>
        </React.Fragment>
      ))}
    </GalleryWrapper>
  )
}

export default TypeGallery
