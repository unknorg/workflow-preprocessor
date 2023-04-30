import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {
  assertGeneratedWorkflows,
  integrationTestPost,
  integrationTestPre
} from '../../test-utils'
import {run} from '../../../src/main'

beforeAll(() => integrationTestPre(__dirname))
afterAll(integrationTestPost)

test('valid template and workflow', async () => {
  await expect(run()).resolves.not.toThrow()
  assertGeneratedWorkflows()
})
