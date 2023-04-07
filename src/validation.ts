import {
  CircularCheckContext,
  Template,
  TemplateWrapper,
  Workflow
} from './types'
import {detectCircularReferences} from './utils'

export const validateTemplate = (template: Template): void => {
  // TODO: implement
  // forbid using reusableJobs
  throw new Error('Not implemented')
}

export const validateWorkflow = (content: Workflow): void => {
  // TODO: implement
  throw new Error('Not implemented')
}

export const validateBuiltTemplates = (templates: TemplateWrapper[]): void => {
  const visitedMap = templates.reduce((map, template) => {
    map.set(template, false)
    return map
  }, new Map<TemplateWrapper, boolean>())
  const remaining = [...templates]
  const context: CircularCheckContext = {
    visited: visitedMap,
    remaining
  }

  const circularRefs: TemplateWrapper[][] = []
  while (remaining.length > 0) {
    const template = context.remaining[0]

    circularRefs.push(...detectCircularReferences(template, context))
  }

  if (circularRefs.length > 0) {
    throw new Error(
      `Circular references detected: ${circularRefs
        .map(refs => refs.map(ref => ref.getName()).join(' -> '))
        .join(', ')}`
    )
  }
}
