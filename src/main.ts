import * as core from '@actions/core'
import {wait} from './wait'
import {processTemplates} from './templates'

async function run(): Promise<void> {
  try {
    const templates = processTemplates()
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
