import {Workflow} from './types'
import {get as getConfig} from './config'
import {loadYAMLInDirectory} from './utils'
import {validateWorkflow} from './validation'

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

export function processWorkflows(): Map<string, Workflow> {
  const workflows = loadWorkflows()
  validateWorkflows(workflows)
  return workflows
}
