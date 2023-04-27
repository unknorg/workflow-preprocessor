import {beforeAll, expect, test} from '@jest/globals'
import {
  assertGeneratedWorkflows,
  generateAndWriteJsonSchemas
} from '../../test-utils'
import {get as getConfig, set as setConfig} from '../../../src/config'
import * as path from 'path'
import {run} from '../../../src/main'

beforeAll(() => {
  const oldVal = getConfig('schemaDir')
  setConfig('schemaDir', path.resolve(__dirname, 'schema'))
  generateAndWriteJsonSchemas('custom-schemas.ts', ['Template', 'Workflow'])
  generateAndWriteJsonSchemas('github-workflow.ts', ['GithubWorkflow'])
  setConfig('schemaDir', oldVal)

  process.chdir(__dirname)
})

test('valid template and workflow', async () => {
  await expect(run()).resolves.not.toThrow()
  assertGeneratedWorkflows()
})
