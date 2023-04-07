const defaultOptions = {
  // The default options
  templatesDir: './src/templates',
  workflowsDir: './src'
}

type Options = keyof typeof defaultOptions

export const set = (option: Options, value: string): void => {
  defaultOptions[option] = value
}

export const get = (option: Options): string => {
  return defaultOptions[option]
}
