import {getFilenameWithoutExtension, loadYAMLInDirectory} from '../src/utils'

let resources: Map<string, unknown> | undefined = undefined

function loadResources(): Map<string, unknown> {
  const resourcesPath = './resources'
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
    resources = loadResources()
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
