import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {integrationTestPost, integrationTestPre} from '../../test-utils'
import {run} from '../../../src/main'

beforeAll(() => integrationTestPre(__dirname))
afterAll(integrationTestPost)

test('invalid template', async () => {
  let error: Error | undefined = undefined
  try {
    await run()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toMatch(
    /Invalid template (.*): Invalid template: must have required property 'uses', must have required property 'run', must match a schema in anyOf, must have required property 'uses', must have required property 'extends', must have required property 'extends', must match a schema in anyOf/
  )
})
