import {Template, TemplateWrapper} from './types'
import {get as getConfig} from './config'
import {validateBuiltTemplates, validateTemplate} from './validation'
import {loadYAMLInDirectory} from './utils'

function loadTemplates(): Map<string, Template> {
  const templatePath = getConfig('templatesDir')
  return loadYAMLInDirectory<Template>(templatePath)
}

function validateTemplates(templates: Map<string, Template>): void {
  for (const [filename, template] of templates) {
    try {
      validateTemplate(template)
    } catch (error) {
      throw new Error(
        `Invalid template ${filename}: ${(error as Error).message}`
      )
    }
  }
}

function buildTemplates(
  templates: Map<string, Template>
): Map<string, TemplateWrapper> {
  const templateWrappers = new Map<string, TemplateWrapper>()
  for (const [filename, template] of templates) {
    const templateWrapper = new TemplateWrapper(filename, template)
    templateWrappers.set(filename, templateWrapper)
  }

  const buildContext = {
    templatesByFilename: templateWrappers
  }

  for (const wrapper of templateWrappers.values()) {
    wrapper.buildOuterReferences(buildContext)
  }

  return templateWrappers
}

export function processTemplates(): Map<string, TemplateWrapper> {
  const templates = loadTemplates()
  validateTemplates(templates)
  const built = buildTemplates(templates)
  validateBuiltTemplates([...built.values()])
  return built
}
