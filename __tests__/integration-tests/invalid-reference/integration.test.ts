import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {integrationTestPost, integrationTestPre} from '../../test-utils'
import {run} from '../../../src/main'

beforeAll(() => integrationTestPre(__dirname))
afterAll(integrationTestPost)

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
