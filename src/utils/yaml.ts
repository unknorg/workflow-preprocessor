import {DEFAULT_SCHEMA, dump, load, Type} from 'js-yaml'
import fs from 'fs'
import path from 'path'
import {debug, trace} from '../logging'
import {get as getConfig} from '../config'

export const loadYAMLInDirectory = <T extends object>(
  dir: string
): Map<string, T> => {
  trace(`utils.ts#loadYAMLInDirectory(${dir})`)
  const objects = new Map<string, T>()
  for (const file of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    if (file.isDirectory() || !file.name.match(/\.ya?ml$/i)) {
      continue
    }
    const fullPath = path.resolve(dir, file.name)
    debug(`Loading '${fullPath}'`)
    const buffer = fs.readFileSync(fullPath, 'utf8')
    const obj = load(buffer, {
      schema
    }) as T
    objects.set(fullPath, obj)
  }
  return objects
}

export const writeYAML = (filename: string, obj: object): void => {
  const yaml = dump(obj, {
    noRefs: true
  })
  const generatedDir = getConfig('generatedDirectory')
  const generatedYmlPath = path.resolve(generatedDir, `${filename}.yml`)
  fs.mkdirSync(generatedDir, {recursive: true})
  fs.writeFileSync(generatedYmlPath, yaml, 'utf8')
}

//region Tags
interface TypedElement {
  customType: string
}
interface ZippedSequence extends TypedElement {
  data: unknown[]
}
function isZippedSequence(obj: unknown): obj is ZippedSequence {
  return (
    obj instanceof Object && 'customType' in obj && obj.customType === 'zipped'
  )
}
function zipped(sequence: unknown[]): ZippedSequence {
  return {
    customType: 'zipped',
    data: sequence
  }
}
const zippedTag = new Type('!zipped', {
  kind: 'sequence',
  construct: zipped
})

function unzip(obj: unknown[]): unknown[] {
  return obj.reduce<unknown[]>(
    (acc, val) =>
      isZippedSequence(val) ? acc.concat(...val.data) : acc.concat([val]),
    []
  )
}
const unzipTag = new Type('!unzip', {
  kind: 'sequence',
  construct: unzip
})

const schema = DEFAULT_SCHEMA.extend([zippedTag, unzipTag])
//endregion
