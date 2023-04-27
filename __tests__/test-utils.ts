import {getFilenameWithoutExtension, loadYAMLInDirectory} from '../src/utils'
import * as config from '../src/config'
import * as TJS from 'typescript-json-schema'
import path from 'path'
import {Definition} from 'typescript-json-schema'
import {get as getConfig} from '../src/config'
import fs from 'fs'
import {expect} from '@jest/globals'

let resources: Map<string, unknown> | undefined = undefined

function loadResources(type: string): Map<string, unknown> {
  const resourcesPath = path.resolve('__tests__', 'resources', type)
  // usage of unit-tested internal functions loadYAMLInDirectory and getFilenameWithoutExtension.
  const objects = loadYAMLInDirectory(resourcesPath)
  return mapKV(
    objects,
    key => getFilenameWithoutExtension(key),
    value => value
  )
}

export function loadYAMLResource<T>(name: string): T {
  if (resources === undefined) {
    resources = loadResources('yml')
  }
  return resources.get(name) as T
}

export const resourceNames = [
  'valid-template',
  'valid-workflow',
  'invalid-template',
  'invalid-workflow'
]

export const validWorkflowObject = {
  name: 'Workflow',
  on: {
    push: {
      branches: ['main']
    },
    pull_request: {
      branches: ['main']
    }
  },
  imports: ['templates/template.yml'],
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      name: 'A job to run advanced tests',
      extends: 'template/job1'
    }
  }
}

export const validTemplateObject = {
  jobs: {
    job1: {
      'runs-on': 'ubuntu-latest',
      name: 'A job to run tests',
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v2'
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v2',
          with: {
            'node-version': 16
          }
        },
        {
          name: 'Install dependencies',
          run: 'npm install'
        },
        {
          name: 'Run tests',
          run: 'npm test'
        },
        {
          name: 'Upload coverage to Codecov',
          uses: 'codecov/codecov-action@v2',
          with: {
            token: '${{ secrets.CODECOV_TOKEN }}',
            files: './coverage/*.json',
            flags: 'unittests',
            name: 'codecov-umbrella',
            fail_ci_if_error: true
          }
        }
      ]
    }
  }
}

export const mapKV = <K1, K2, V1, V2>(
  map: Map<K1, V1>,
  keyFn: (key: K1) => K2,
  valueFn: (value: V1) => V2
): Map<K2, V2> => {
  return [...map.entries()].reduce(
    (acc, cv) => acc.set(keyFn(cv[0]), valueFn(cv[1])),
    new Map<K2, V2>()
  )
}

export const mapKeys = <K>(map: Map<K, unknown>): K[] => {
  return [...map.keys()]
}

const state: {
  config?: typeof config._testing.defaultOptions
} = {}
export const initState = (): void => {
  state.config = config._testing.defaultOptions
}
export const resetState = (): void => {
  for (const key in state.config) {
    const typedKey = key as keyof typeof state.config
    config.set(typedKey, state.config[typedKey])
  }
}

const settings: TJS.PartialArgs = {
  required: true,
  noExtraProps: true
}
const generateJsonSchemas = (
  module: string,
  schemas: string[]
): Map<string, Definition> => {
  const program = TJS.getProgramFromFiles([path.join('src', 'schema', module)])

  const generator = TJS.buildGenerator(program, settings)
  if (generator === null) {
    throw new Error('Failed to generate JSON schemas')
  }

  return schemas.reduce(
    (acc, schema) => acc.set(schema, generator.getSchemaForSymbol(schema)),
    new Map<string, Definition>()
  )
}
export const generateAndWriteJsonSchemas = (
  module: string,
  schemas: string[]
): void => {
  const generated = generateJsonSchemas(module, schemas)
  const generatedDir = getConfig('schemaDir')
  fs.mkdirSync(generatedDir, {recursive: true})

  for (const [key, value] of generated.entries()) {
    const generatedJsonPath = path.resolve(
      generatedDir,
      `${key.toLowerCase()}.json`
    )
    fs.writeFileSync(generatedJsonPath, JSON.stringify(value), 'utf8')
  }
}

export const deleteGeneratedJsonSchemas = (): void => {
  const generatedDir = getConfig('schemaDir')
  fs.rmSync(generatedDir, {recursive: true})
}

export const assertGeneratedWorkflows = (): void => {
  // Process cwd is set to integration-test respected directory
  const expectedWorkflows = mapKV(
    loadYAMLInDirectory('./expected'),
    key => getFilenameWithoutExtension(key),
    value => value
  )

  const generatedWorkflows = mapKV(
    loadYAMLInDirectory('./generated'),
    key => getFilenameWithoutExtension(key),
    value => value
  )

  expect(expectedWorkflows.size).toEqual(generatedWorkflows.size)
  for (const [key, value] of expectedWorkflows.entries()) {
    expect(generatedWorkflows.has(key)).toBeTruthy()
    expect(generatedWorkflows.get(key)).toEqual(value)
  }
}
