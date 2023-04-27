import {expect, test} from '@jest/globals'
import * as config from '../src/config'
import {_testing} from "../src/config";

test('gets default config values', async () => {
  for (const [option, value] of Object.entries(_testing.defaultOptions)) {
    expect(config.get(option as any)).toBe(value)
  }
})

test('sets and gets config values', async () => {
  for (const option of Object.keys(_testing.defaultOptions)) {
    config.set(option as any, 'foo')
    expect(config.get(option as any)).toBe('foo')
  }
})

