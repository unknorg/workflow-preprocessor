// <a href="https://stackoverflow.com/a/4250408">StackOverflow answer</a>
import {CircularCheckContext, ElementWrapper, ElementType} from './types'
import * as fs from 'fs'
import {dump, load} from 'js-yaml'
import {
  ExtendedJob,
  ExtendedReusableWorkflowCallJob,
  Job
} from './schema/custom-schemas'
import {get as getConfig} from './config'

export const loadYAMLInDirectory = <T extends object>(
  dir: string
): Map<string, T> => {
  const objects = new Map<string, T>()
  for (const file of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    if (file.isDirectory()) {
      continue
    }
    const buffer = fs.readFileSync(`${dir}/${file.name}`, 'utf8')
    const obj = load(buffer) as T
    // Not possible to have 2 files with the same name, so no need to check if the key already exists
    const withoutExtension = getFilenameWithoutExtension(file.name)
    objects.set(withoutExtension, obj)
  }
  return objects
}

export const writeYAML = (filename: string, obj: object): void => {
  const yaml = dump(obj)
  const generatedDir = getConfig('generatedDir')
  fs.mkdirSync(generatedDir, {recursive: true})
  const path = `${generatedDir}/${filename}.yml`
  fs.writeFileSync(path, yaml, 'utf8')
}

export const getFilenameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '')
}

export const combineObjects = <T extends object>(
  original: T,
  extension: T
): T => {
  const copied = structuredClone(original)
  merge(copied, extension)
  return copied
}

const merge = <T extends object>(obj: T, toMerge: T): void => {
  for (const key in toMerge) {
    if (!obj.hasOwnProperty(key)) {
      obj[key] = toMerge[key]
    } else if (isPrimitive(obj[key]) || isPrimitive(toMerge[key])) {
      obj[key] = toMerge[key]
    } else {
      merge(obj[key] as object, toMerge[key] as object)
    }
  }
}

const isPrimitive = (value: unknown): boolean => {
  return (
    value === null || (typeof value !== 'function' && typeof value !== 'object')
  )
}

/**
 * Detects circular references which include the given element. <br/>
 * The visited part of the context is mutated during the process,
 * but the original context is restored before returning.
 * @param element The element to check
 * @param context The context to use, must contain the visited map and the remaining templates
 */
export const detectCircularReferences = (
  element: ElementWrapper<ElementType>,
  context: CircularCheckContext
): ElementWrapper<ElementType>[][] => {
  const circularReferences: ElementWrapper<ElementType>[][] = []
  context.visited.set(element, true)
  const index = context.remaining.indexOf(element)
  if (index > -1) {
    context.remaining.splice(index, 1)
  }
  for (const ref of element.getOutRefs().values()) {
    if (context.visited.has(ref)) {
      circularReferences.push([element, ref])
    } else {
      circularReferences.push(
        ...detectCircularReferences(ref, context).map(r => [element, ...r])
      )
    }
  }
  context.visited.set(element, false)
  return circularReferences
}

export const isExtendedJob = (
  job: Job
): job is ExtendedJob | ExtendedReusableWorkflowCallJob => {
  return job.hasOwnProperty('extended')
}

// <a href="https://stackoverflow.com/a/1026087">StackOverflow answer</a>
export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
