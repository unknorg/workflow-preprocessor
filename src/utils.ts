// <a href="https://stackoverflow.com/a/4250408">StackOverflow answer</a>
import {
  CircularCheckContext,
  ExtendedJob,
  ExtendedReusableWorkflowCallJob,
  Job,
  TemplateWrapper
} from './types'
import fs from 'fs'
import {load} from 'js-yaml'

export const loadYAMLInDirectory = <T extends object>(
  dir: string
): Map<string, T> => {
  const objects = new Map<string, T>()
  for (const filename of fs.readdirSync(dir)) {
    const buffer = fs.readFileSync(`${dir}/${filename}`, 'utf8')
    const obj = load(buffer) as T
    // Not possible to have 2 files with the same name, so no need to check if the key already exists
    const withoutExtension = getFilenameWithoutExtension(filename)
    objects.set(withoutExtension, obj)
  }
  return objects
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
 * Detects circular references which include the given template. <br/>
 * The visited part of the context is mutated during the process,
 * but the original context is restored before returning.
 * @param template The template to check
 * @param context The context to use, must contain the visited map and the remaining templates
 */
export const detectCircularReferences = (
  template: TemplateWrapper,
  context: CircularCheckContext
): TemplateWrapper[][] => {
  const circularReferences: TemplateWrapper[][] = []
  context.visited.set(template, true)
  const index = context.remaining.indexOf(template)
  if (index > -1) {
    context.remaining.splice(index, 1)
  }
  for (const ref of template.getOutRefs().values()) {
    if (context.visited.has(ref)) {
      circularReferences.push([template, ref])
    } else {
      circularReferences.push(
        ...detectCircularReferences(ref, context).map(r => [template, ...r])
      )
    }
  }
  context.visited.set(template, false)
  return circularReferences
}

export const isExtendedJob = (
  job: Job
): job is ExtendedJob | ExtendedReusableWorkflowCallJob => {
  return job.hasOwnProperty('extended')
}
