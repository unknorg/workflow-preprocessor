import {CircularCheckContext, ElementType, ElementWrapper} from '../types'
import {
  ExtendedJob,
  ExtendedReusableWorkflowCallJob,
  Job
} from '../schema/custom-schemas'
import path from 'path'

//region YAML

//endregion

// <a href="https://stackoverflow.com/a/4250408">StackOverflow answer</a>
export const getFilenameWithoutExtension = (filePath: string): string => {
  return path.basename(filePath).replace(/\.[^/.]+$/, '')
}

//region Object manipulation
export const combineObjects = <T extends object>(
  original: T,
  extension: T | Partial<T>
): T => {
  const copied = structuredClone(original)
  merge(copied, extension)
  return copied
}

const merge = <T extends object>(obj: T, toMerge: T): void => {
  for (const key in toMerge) {
    if (toMerge[key] === undefined) {
      delete obj[key]
    } else if (!obj.hasOwnProperty(key)) {
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

export const coldObject = <T>(creator: () => T): (() => T) => {
  let cache: T | undefined = undefined
  return () => cache ?? (cache = creator())
}
//endregion

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
    if (context.visited.has(ref) && context.visited.get(ref)) {
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
  return job.hasOwnProperty('extends')
}

// <a href="https://stackoverflow.com/a/1026087">StackOverflow answer</a>
export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
