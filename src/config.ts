const defaultOptions = {
  // The default options
  templatesDir: './src/templates',
  workflowsDir: './src',
  schemaDir: './schema',
  generatedDir: './generated',
  logLevel: 'trace',
  useCustomLogger: 'false',
  dieWhenInvalid: 'true'
}

type Options = keyof typeof defaultOptions

export const set = (option: Options, value: string): void => {
  defaultOptions[option] = value
}

export const get = (option: Options): string => {
  return defaultOptions[option]
}

// Testing
export const _testing = {
  defaultOptions
}
