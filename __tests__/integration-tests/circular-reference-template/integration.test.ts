import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {integrationTestPost, integrationTestPre} from '../../test-utils'
import {run} from '../../../src/main'

beforeAll(() => integrationTestPre(__dirname))
afterAll(integrationTestPost)

test('circular references', async () => {
  let error: Error | undefined = undefined
  try {
    await run()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeDefined()
  expect(error?.message).toMatch(
    /Circular references detected: (.*)workflow.yml -> (.*)template.yml -> (.*)template2.yml -> (.*)template.yml/
  )
})
