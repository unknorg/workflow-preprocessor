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
    new RegExp(
      `Invalid template (.*)template.yml: Invalid template: Instance Path '/jobs/job1/steps/0': must have required property 'uses', must have required property 'run', must match a schema in anyOf
Instance Path '/jobs/job1': must have required property 'uses', must have required property 'extends', must have required property 'extends', must match a schema in anyOf`
    )
  )
})
