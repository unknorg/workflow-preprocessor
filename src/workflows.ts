import {
  BuildContext,
  ElementType,
  ElementWrapper,
  TemplateWrapper,
  Workflow,
  WorkflowWrapper
} from './types'
import {get as getConfig} from './config'
import {getFilenameWithoutExtension, loadYAMLInDirectory} from './utils'
import {validateWorkflow} from './validation'
import {GithubWorkflow} from './schema/github-workflow'
import {debug, info, trace} from './logging'

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
  for (const [absolutePath, workflow] of workflows) {
    const workflowWrapper = new ElementWrapper(
      absolutePath,
      workflow,
      'workflow'
    )
    workflowWrappers.set(absolutePath, workflowWrapper)
  }

  const buildContext: BuildContext<ElementWrapper<ElementType>> = {
    // Creating a new map from workflowWrappers so that we won't mutate it
    elementsByFilename: new Map<string, ElementWrapper<ElementType>>(
      workflowWrappers
    )
  }
  for (const [absolutePath, template] of templates) {
    buildContext.elementsByFilename.set(absolutePath, template)
  }

  for (const wrapper of workflowWrappers.values()) {
    wrapper.buildOuterReferences(buildContext)
  }

  return workflowWrappers
}

export function load(
  templates: Map<string, TemplateWrapper>
): Map<string, WorkflowWrapper> {
  trace('workflows.ts#load()')
  const workflows = loadWorkflows()
  validateWorkflows(workflows)
  return buildWrappers(workflows, templates)
}

function buildWorkflow(workflow: WorkflowWrapper): GithubWorkflow {
  info(`Building ${workflow.getAbsolutePath()}`)
  const cloned: Workflow = structuredClone(workflow.getElement())
  cloned.imports = undefined

  for (const jobName in workflow.getElement().jobs) {
    debug(`Patching job ${jobName}`)
    cloned.jobs[jobName] = workflow.getJob(jobName)
  }

  return cloned
}

export function buildWorkflows(
  workflows: WorkflowWrapper[]
): Map<string, GithubWorkflow> {
  trace('workflows.ts#buildWorkflows()')
  return workflows.reduce((map, workflow) => {
    map.set(
      getFilenameWithoutExtension(workflow.getAbsolutePath()),
      buildWorkflow(workflow)
    )
    return map
  }, new Map<string, GithubWorkflow>())
}
