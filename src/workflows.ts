import {
  BuildContext,
  ElementType,
  ElementWrapper,
  TemplateWrapper,
  Workflow,
  WorkflowWrapper
} from './types'
import {get as getConfig} from './config'
import {loadYAMLInDirectory} from './utils'
import {validateWorkflow} from './validation'
import {GithubWorkflow} from './schema/github-workflow'

function loadWorkflows(): Map<string, Workflow> {
  const workflowPath = getConfig('workflowsDir')
  return loadYAMLInDirectory<Workflow>(workflowPath)
}

function validateWorkflows(workflows: Map<string, Workflow>): void {
  for (const [filename, workflow] of workflows) {
    try {
      validateWorkflow(workflow)
    } catch (error) {
      throw new Error(
        `Invalid workflow ${filename}: ${(error as Error).message}`
      )
    }
  }
}

function buildWrappers(
  workflows: Map<string, Workflow>,
  templates: Map<string, TemplateWrapper>
): Map<string, WorkflowWrapper> {
  const workflowWrappers = new Map<string, WorkflowWrapper>()
  for (const [filename, workflow] of workflows) {
    const workflowWrapper = new ElementWrapper(filename, workflow, 'workflow')
    workflowWrappers.set(filename, workflowWrapper)
  }

  const buildContext: BuildContext<ElementWrapper<ElementType>> = {
    elementsByFilename: {
      ...workflowWrappers
    }
  }
  const templatesDir = getConfig('templatesDir')
  for (const [filename, template] of templates) {
    buildContext.elementsByFilename.set(`${templatesDir}/${filename}`, template)
  }

  for (const wrapper of workflowWrappers.values()) {
    wrapper.buildOuterReferences(buildContext)
  }

  return workflowWrappers
}

export function load(
  templates: Map<string, TemplateWrapper>
): Map<string, WorkflowWrapper> {
  const workflows = loadWorkflows()
  validateWorkflows(workflows)
  return buildWrappers(workflows, templates)
}

function buildWorkflow(workflow: WorkflowWrapper): GithubWorkflow {
  const cloned: Workflow = structuredClone(workflow.getElement())
  cloned.imports = undefined

  for (const jobName in workflow.getElement().jobs) {
    cloned.jobs[jobName] = workflow.getJob(jobName)
  }

  return cloned
}

export function buildWorkflows(
  workflows: WorkflowWrapper[]
): Map<string, GithubWorkflow> {
  return workflows.reduce((map, workflow) => {
    map.set(workflow.getName(), buildWorkflow(workflow))
    return map
  }, new Map<string, GithubWorkflow>())
}
