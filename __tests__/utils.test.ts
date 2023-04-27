import {jest, expect, test, beforeAll, beforeEach} from '@jest/globals'
import * as utils from '../src/utils'
import {
  initState,
  mapKeys,
  mapKV,
  resetState,
  resourceNames,
  validTemplateObject,
  validWorkflowObject
} from './test-utils'
import {getFilenameWithoutExtension} from '../src/utils'
import * as path from 'path'
import {Job} from '../src/types'

beforeAll(() => {
  initState()
})
beforeEach(() => {
  resetState()
})

test('correctly loads yaml from directory', async () => {
  const resourcesDir = './__tests__/resources/yml'
  const objects = utils.loadYAMLInDirectory(resourcesDir)

  expect(objects.size).toBe(resourceNames.length)

  // check that all resources are loaded using full path
  const currentWorkingDirectory = process.cwd()
  const fullPathWorkDir = path.join(currentWorkingDirectory, resourcesDir)
  for (const obj in objects.keys()) {
    expect(obj.startsWith(fullPathWorkDir)).toBe(true)
  }

  const expectedObjects = mapKV(
    objects,
    key => getFilenameWithoutExtension(key),
    value => value
  )
  expect(mapKeys(expectedObjects).sort()).toEqual(resourceNames.sort())

  expect(expectedObjects.get('valid-template')).toEqual(validTemplateObject)
  expect(expectedObjects.get('valid-workflow')).toEqual(validWorkflowObject)
})

test.each([
  ['foo.yml', 'foo'],
  ['foo.yaml', 'foo'],
  ['foo.zip.gz', 'foo.zip'],
  ['foo', 'foo'],
  ['/home/foo/bar.yml', 'bar'],
  ['../usr/foo/bar.yaml', 'bar'],
  ['../usr/space dir/bar.xml', 'bar']
])(
  'correctly extracts filename without extension',
  (path: string, name: string) => {
    expect(getFilenameWithoutExtension(path)).toBe(name)
  }
)

test.each([
  [{foo: 'bar'}, {foo: 'bar'}, {foo: 'bar'}],
  [{foo: 'bar'}, {foo: 'baz'}, {foo: 'baz'}],
  [{foo: 'bar'}, {bar: 'baz'}, {foo: 'bar', bar: 'baz'}],
  [{foo: 'bar', bar: 'bar'}, {foo: 'baz'}, {foo: 'baz', bar: 'bar'}],
  [{foo: [1, 2, 3]}, {foo: [4, 5, 6]}, {foo: [4, 5, 6]}],
  [
    {foo: {val1: 'bar', val2: 'baz'}},
    {foo: {val1: 'baz'}},
    {foo: {val1: 'baz', val2: 'baz'}}
  ],
  [
    {foo: {val1: 'bar', val2: 'baz'}},
    {foo: {val1: 'baz', val2: undefined}},
    {foo: {val1: 'baz'}}
  ]
])(`correctly combines objects`, (original, extension, expected) => {
  expect(utils.combineObjects(original, extension)).toEqual(expected)
})

test.each([
  [{} as unknown as Job, false],
  [{invalid: 'job'} as unknown as Job, false],
  [{'runs-on': 'bar'}, false],
  [{'runs-on': 'bar', uses: 'foo'}, false],
  [{'runs-on': 'bar', extends: 'workflow'}, true]
])('correctly detects extended jobs', (job, expected) => {
  expect(utils.isExtendedJob(job)).toBe(expected)
})

test.each([
  ['foo', 'Foo'],
  ['foo bar', 'Foo bar'],
  ['', '']
])('correctly capitalizes string', (input, expected) => {
  expect(utils.capitalizeFirstLetter(input)).toBe(expected)
})

test('does not create object immediately', () => {
  const creator = jest.fn(() => 'string')
  creator.mockReturnValueOnce('foo')
  const frozen = utils.coldObject(creator)

  expect(creator.mock.calls.length).toBe(0)
})

test('creates object on first access', () => {
  const creator = jest.fn(() => 'string')
  creator.mockReturnValueOnce('foo')
  const frozen = utils.coldObject(creator)

  expect(frozen()).toBe('foo')
  expect(creator.mock.calls.length).toBe(1)
})

test('creates object only once', async () => {
  const creator = jest.fn(() => 'string')
  creator.mockReturnValueOnce('foo')
  const frozen = utils.coldObject(creator)

  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
      .then(() => setTimeout(() => {}, 100))
      .then(() => expect(frozen()).toBe('foo'))
  }

  expect(creator.mock.calls.length).toBe(1)
})
