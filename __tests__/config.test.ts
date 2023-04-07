import {expect, test, beforeEach, beforeAll} from '@jest/globals'
import * as config from '../src/config'
import {_testing} from '../src/config'
import {initState, resetState} from './test-utils'

beforeAll(() => {
  initState()
})
beforeEach(() => {
  resetState()
})

test('sets and gets config values', async () => {
  for (const option of Object.keys(_testing.defaultOptions)) {
    config.set(option as any, 'foo')
    expect(config.get(option as any)).toBe('foo')
  }
})

test('gets default config values', async () => {
  for (const [option, value] of Object.entries(_testing.defaultOptions)) {
    expect(config.get(option as any)).toBe(value)
  }
})
