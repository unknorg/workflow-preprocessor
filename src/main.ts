import * as core from '@actions/core'
import {load as loadTemplates} from './templates'
import {buildWorkflows, load as loadWorkflows} from './workflows'
import {validateNoCircularRefs} from './validation'
import {writeYAML} from './utils'

async function run(): Promise<void> {
  try {
    const templates = loadTemplates()
    const workflows = loadWorkflows(templates)
    validateNoCircularRefs([...workflows.values()])

    const githubWorkflows = buildWorkflows([...workflows.values()])
    for (const [filename, workflow] of githubWorkflows) {
      core.info(`Writing ${filename}`)
      writeYAML(filename, workflow)
    }

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    throw error
  }
}

run()
