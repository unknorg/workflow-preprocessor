const defaultOptions = {
  // The default options
  templatesDirectory: './src/templates',
  workflowsDirectory: './src',
  schemaDirectory: './schema',
  generatedDirectory: './generated',
  logLevel: 'trace',
  useCustomLogger: 'false',
  dieWhenInvalid: 'true'
}

type Options = keyof typeof defaultOptions

const optionToEnv = new Map<Options, string>([
  ['templatesDirectory', 'TEMPLATES-DIRECTORY'],
  ['workflowsDirectory', 'WORKFLOWS-DIRECTORY'],
  ['schemaDirectory', 'SCHEMA-DIRECTORY'],
  ['generatedDirectory', 'GENERATED-DIRECTORY'],
  ['logLevel', 'LOG-LEVEL'],
  ['dieWhenInvalid', 'DIE-WHEN-INVALID']
])

export const set = (option: Options, value: string): void => {
  defaultOptions[option] = value
}

export const get = (option: Options): string => {
  return getFromEnv(option) ?? defaultOptions[option]
}

const getFromEnv = (option: Options): string | undefined => {
  return process.env[`INPUT_${optionToEnv.get(option) ?? 'NONE'}`]
}

// Testing
export const _testing = {
  getFromEnv,
  defaultOptions
}
