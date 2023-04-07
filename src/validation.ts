import {
  CircularCheckContext,
  Template,
  ElementWrapper,
  Workflow,
  ElementType
} from './types'
import {coldObject, detectCircularReferences} from './utils'
import {GithubWorkflow} from './schema/github-workflow'
import Ajv, {ValidateFunction} from 'ajv'
import fs from 'fs'
import {error as logError, info, trace} from './logging'
import path from 'path'
import {get as getConfig} from './config'

const ajv = new Ajv({
  logger: {
    warn: () => {},
    error: (args: unknown[]) => logError(args.join(' ')),
    log: (args: unknown[]) => info(args.join(' '))
  }
})
function createValidator<T>(jsonSchemaPath: string): ValidateFunction<T> {
  const schema = JSON.parse(fs.readFileSync(jsonSchemaPath, 'utf8'))
  return ajv.compile(schema) as ValidateFunction<T>
}

const validateWorkflowSchema = coldObject(() =>
  createValidator<Workflow>(path.join(getConfig('schemaDir'), 'workflow.json'))
)
const validateTemplateSchema = coldObject(() =>
  createValidator<Template>(path.join(getConfig('schemaDir'), 'template.json'))
)
const validateGithubWorkflowSchema = coldObject(() =>
  createValidator<GithubWorkflow>(
    path.join(getConfig('schemaDir'), 'githubworkflow.json')
  )
)

export const validateTemplate = (template: Template): void => {
  trace('validation.ts#validateTemplate()')
  // TODO: Forbid using reusableJobs in templates
  // TODO: Forbid having duplicate names in jobs
  if (!validateTemplateSchema()(template)) {
    throw new Error(
      `Invalid template: ${validateTemplateSchema()
        .errors?.map(error => error.message)
        .join(', ')}`
    )
  }
}

export const validateWorkflow = (content: Workflow): void => {
  trace('validation.ts#validateWorkflow()')
  if (!validateWorkflowSchema()(content)) {
    throw new Error(
      `Invalid workflow: ${validateWorkflowSchema()
        .errors?.map(error => error.message)
        .join(', ')}`
    )
  }
}

export const validateNoCircularRefs = (
  elements: ElementWrapper<ElementType>[]
): void => {
  trace('validation.ts#validateNoCircularRefs()')
  const visitedMap = elements.reduce((map, template) => {
    map.set(template, false)
    return map
  }, new Map<ElementWrapper<ElementType>, boolean>())
  const remaining = [...elements]
  const context: CircularCheckContext = {
    visited: visitedMap,
    remaining
  }

  const circularRefs: ElementWrapper<ElementType>[][] = []
  while (remaining.length > 0) {
    const template = context.remaining[0]

    circularRefs.push(...detectCircularReferences(template, context))
  }

  if (circularRefs.length > 0) {
    throw new Error(
      `Circular references detected: ${circularRefs
        .map(refs => refs.map(ref => ref.getAbsolutePath()).join(' -> '))
        .join(', ')}`
    )
  }
}

export const validateGithubWorkflow = (
  content: Workflow | GithubWorkflow
): content is GithubWorkflow => {
  trace('validation.ts#validateWorkflow()')
  if (!validateGithubWorkflowSchema()(content)) {
    throw new Error(
      `Invalid workflow: ${validateGithubWorkflowSchema()
        .errors?.map(error => error.message)
        .join(', ')}`
    )
  }

  return true
}
