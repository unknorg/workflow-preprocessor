import {
  CircularCheckContext,
  Template,
  ElementWrapper,
  Workflow,
  ElementType
} from './types'
import {detectCircularReferences} from './utils'
import {GithubWorkflow} from './schema/github-workflow'
import Ajv, {ValidateFunction} from 'ajv'
import fs from 'fs'

const ajv = new Ajv()
function createValidator<T>(jsonSchemaPath: string): ValidateFunction<T> {
  const schema = JSON.parse(fs.readFileSync(jsonSchemaPath, 'utf8'))
  return ajv.compile(schema) as ValidateFunction<T>
}

const validateWorkflowSchema = createValidator<Workflow>('schema/workflow.json')
const validateTemplateSchema = createValidator<Template>('schema/template.json')

export const validateTemplate = (template: Template): void => {
  // TODO: Forbid using reusableJobs in templates
  // TODO: Forbid having duplicate names in jobs
  if (!validateTemplateSchema(template)) {
    throw new Error(
      `Invalid template: ${validateTemplateSchema.errors
        ?.map(error => error.message)
        .join(', ')}`
    )
  }
}

export const validateWorkflow = (content: Workflow): void => {
  if (!validateWorkflowSchema(content)) {
    throw new Error(
      `Invalid workflow: ${validateWorkflowSchema.errors
        ?.map(error => error.message)
        .join(', ')}`
    )
  }
}

export const validateNoCircularRefs = (
  elements: ElementWrapper<ElementType>[]
): void => {
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

export const validateGithubWorkflow = (content: GithubWorkflow): void => {}
