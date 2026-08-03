// @ts-expect-error -- Node.js built-in, no @types/node installed
import fs from 'fs'

const TYPOGRAPHY_FILE = 'src/lib/styles/typography.scss'

type TypeProps = {
  fontSize: string
  fontFamily: string
  fontWeight: string
  fontStyle?: string
  textTransform?: string
  letterSpacing?: string
}

type TypeObject = {
  name: string
} & TypeProps

type TypeInfo = {
  level?: number
  letterform?: 'Serif' | 'Sans' | 'Mono'
  modifier?: 'Bold' | 'Italic'
  size?: 'Small' | 'Large'
}

export type TypeDefinition = {
  name: string
  category: string
} & TypeInfo

export type TypeCategories = {
  category: string
  categoryTitle?: string
  definitions: TypeDefinition[]
}[]

export default function typographyTransform() {
  const virtualModuleId = 'virtual:typography-importer'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'typography-importer', // required, will show up in warnings and errors
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id !== resolvedVirtualModuleId) {
        return
      }
      const typographyContent = fs.readFileSync(TYPOGRAPHY_FILE, 'utf-8')

      const customFormat = toCustomFormat(typographyContent)
      const objects = transformToObjects(customFormat)
      const definitions = transformToDefinition(objects)

      return `export const typeDefinitons = ${JSON.stringify(
        definitions,
        null,
        2,
      )}`
    },
  }
}

function toTitleCase(input: string): string {
  if (input === 'ui') return 'UI'
  return input.replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  })
}
function kebabToCamel(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, match) => match.toUpperCase())
}

function toCustomFormat(content: string): string[] {
  const lines = content.split('\n')
  const startIndex = lines.findIndex((line) =>
    line.includes('$typography-styles: ('),
  )
  if (startIndex === -1) {
    // Handle the case where the starting line is not found
    console.error('Starting line not found.')
    return []
  }
  let bracketCount = 1
  const result: string[] = []

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    bracketCount += (line.match(/\(/g) || []).length
    bracketCount -= (line.match(/\)/g) || []).length
    if (bracketCount === 0) {
      // Closing bracket found
      break
    }
    const trimmedLine = line.trim().replace(/,$/, '')
    // if the line is ")" or ")," skip it
    if (
      trimmedLine === ')' ||
      trimmedLine === '),' ||
      trimmedLine === '(' ||
      trimmedLine.startsWith('//')
    ) {
      continue
    }
    // if the line ends with : ( or : "action-x-y: (" convert to "> action-x-y"
    if (trimmedLine.endsWith(': (') || trimmedLine.endsWith(':')) {
      const [name] = line.split(':')
      result.push(`> ${name.trim()}`)
      continue
    }
    result.push(trimmedLine)
  }
  return result
}

function transformToObjects(lines: string[]): TypeObject[] {
  const result: any[] = []
  let currentObject: any = {}

  for (const line of lines) {
    if (line.startsWith('>')) {
      // Start a new object
      if (currentObject.name) {
        result.push(currentObject)
      }
      // Extract the name from the line
      const name = line.substring(2).trim()
      currentObject = { name }
    } else {
      // Split the line into key and value
      const [key, value] = line.split(':').map((str) => str.trim())
      // Remove potential quotes around the key
      const cleanedKey = key.replace(/^["']|["']$/g, '')
      // Convert kebab case to camel case
      const camelCaseKey = kebabToCamel(cleanedKey)
      // Assign the key-value pair to the current object
      currentObject[camelCaseKey] = value
    }
  }
  // Add the last object to the result
  if (currentObject.name) {
    result.push(currentObject)
  }
  return result
}

function transformToDefinition(obj: TypeObject[]): TypeCategories {
  const result: TypeCategories = []
  // iterate over the objects
  for (const object of obj) {
    // we split up the name by the "-" character
    // the first part is the category, so we split it off
    const [category, ...nameParts] = object.name.split('-')
    // check if the category already exists in the result
    let categoryIndex = result.findIndex((cat) => cat.category === category)
    // if it does not exist, we add it
    if (categoryIndex === -1) {
      result.push({
        category,
        categoryTitle: toTitleCase(category),
        definitions: [],
      })
      categoryIndex = result.length - 1
    }

    const { name } = object
    result[categoryIndex].definitions.push({
      name,
      category: toTitleCase(category),
      ...identifyTypeInfo(nameParts),
    })
  }

  return result
}

function identifyTypeInfo(name: string[]): TypeInfo {
  const info: TypeInfo = {}
  for (const part of name) {
    const number = Number(part)
    if (!isNaN(number)) {
      info.level = number
    } else if (part === 'serif' || part === 'sans' || part === 'mono') {
      info.letterform =
        part === 'serif' ? 'Serif' : part === 'sans' ? 'Sans' : 'Mono'
    } else if (part === 'bold' || part === 'italic') {
      info.modifier = part === 'bold' ? 'Bold' : 'Italic'
    } else if (part === 'small' || part === 'large') {
      info.size = part === 'small' ? 'Small' : 'Large'
    }
  }
  return info
}
