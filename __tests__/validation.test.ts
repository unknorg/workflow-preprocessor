import {expect, test, beforeAll, beforeEach, afterAll} from '@jest/globals'
import {validateTemplate} from '../src/validation'
import {
  deleteGeneratedJsonSchemas,
  generateAndWriteJsonSchemas,
  initState,
  loadYAMLResource,
  resetState
} from './test-utils'
import {Template} from '../src/types'
import {set} from '../src/config'

beforeAll(() => {
  initState()
  set('schemaDir', './__tests__/resources/schemas')
  generateAndWriteJsonSchemas('custom-schemas.ts', ['Template', 'Workflow'])
})
beforeEach(() => {
  resetState()
  set('schemaDir', './__tests__/resources/schemas')
})
afterAll(() => {
  deleteGeneratedJsonSchemas()
})

test('accept valid templates', async () => {
  const tested = loadYAMLResource<Template>('valid-template')
  expect(() => validateTemplate(tested)).not.toThrow()
})

test('reject invalid templates', async () => {
  const tested = loadYAMLResource<Template>('invalid-template')
  expect(() => validateTemplate(tested)).toThrow(
    new Error('Invalid template: must be object')
  )
})
