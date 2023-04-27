import {beforeAll, expect, test} from '@jest/globals'
import {generateAndWriteJsonSchemas} from '../../test-utils'
import {get as getConfig, set as setConfig} from '../../../src/config'
import * as path from 'path'
import {run} from '../../../src/main'
import exp = require('constants')

beforeAll(() => {
  const oldVal = getConfig('schemaDir')
  setConfig('schemaDir', path.resolve(__dirname, 'schema'))
  generateAndWriteJsonSchemas('custom-schemas.ts', ['Template', 'Workflow'])
  generateAndWriteJsonSchemas('github-workflow.ts', ['GithubWorkflow'])
  setConfig('schemaDir', oldVal)

  process.chdir(__dirname)
})

test('invalid reference', async () => {
  let error: Error | undefined = undefined
  try {
    await run()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toMatch(
    /Element '(.*)non-existing-template.yml' not found, available elements: (.*)template.yml/
  )
})
