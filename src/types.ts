import {
  combineObjects,
  getFilenameWithoutExtension,
  isExtendedJob
} from './utils/misc'
import {
  ExtendedJob,
  ExtendedReusableWorkflowCallJob,
  Job as JobSchema,
  Template as TemplateSchema,
  Workflow as WorkflowSchema
} from './schema/custom-schemas'
import path from 'path'
import {debug} from './logging'

export interface BuildContext<T> {
  elementsByFilename: Map<string, T>
}

interface Builder<T> {
  buildOuterReferences(context: BuildContext<T>): void
}

export type Job = JobSchema
export type Template = TemplateSchema
export type Workflow = WorkflowSchema
export type ElementType = Template | Workflow
export class ElementWrapper<Element extends ElementType>
  implements Builder<ElementWrapper<Element>>
{
  private readonly absolutePath: string
  private readonly element: Element
  private readonly elementType: string

  private readonly outRefs: Map<string, ElementWrapper<ElementType>> = new Map()
  private readonly inRefs: Map<string, ElementWrapper<ElementType>> = new Map()

  constructor(absolutePath: string, element: Element, elementType: string) {
    this.absolutePath = absolutePath
    this.element = element
    this.elementType = elementType
  }

  getAbsolutePath(): string {
    return this.absolutePath
  }

  getElement(): Element {
    return this.element
  }

  getOutRefs(): Map<string, ElementWrapper<ElementType>> {
    return this.outRefs
  }

  private addOutRef(ref: string, template: ElementWrapper<ElementType>): void {
    this.outRefs.set(ref, template)
  }

  private addInRef($path: string, template: ElementWrapper<ElementType>): void {
    this.inRefs.set($path, template)
  }

  getJob(identifier: string): Job {
    const job = this.element.jobs[identifier]
    if (!job) {
      throw new Error(
        `Object '${identifier}' not found in ${this.elementType} '${this.absolutePath}'`
      )
    }

    if (isExtendedJob(job)) {
      debug(`Processing extended job '${identifier}'`)
      const parentRef = job.extends
      const templateRef = parentRef.split('/')[0]
      const objectRef = parentRef.split('/')[1]
      const template = this.outRefs.get(templateRef)
      if (!template) {
        throw new Error(
          `Cannot extend '${parentRef}' in ${this.elementType}  '${this.absolutePath}': '${templateRef}' was not imported`
        )
      }

      const parentObject = template.getJob(objectRef)
      const withoutExtends: Partial<
        ExtendedJob | ExtendedReusableWorkflowCallJob
      > = {...job, extends: undefined}
      this.element.jobs[identifier] = combineObjects(
        parentObject,
        withoutExtends
      )
    }

    return this.element.jobs[identifier]
  }

  /**
   * Updates the outer references of this template using the given context.
   * @param context The global context
   */
  buildOuterReferences(
    context: BuildContext<ElementWrapper<ElementType>>
  ): void {
    if (!this.element.imports) {
      // No imports, nothing to do
      return
    }

    for (const imported of this.element.imports) {
      let relativePath: string
      let refName: string
      if (typeof imported === 'string') {
        // Import without ref, defaults to the path
        relativePath = imported
        refName = getFilenameWithoutExtension(imported)
      } else {
        // Import with path
        relativePath = imported.path
        refName = imported.ref
      }
      const absolutePath = path.resolve(
        path.dirname(this.absolutePath),
        relativePath
      )

      const template = context.elementsByFilename.get(absolutePath)
      if (!template) {
        throw new Error(
          `Element '${absolutePath}' not found, available elements: ${Array.from(
            context.elementsByFilename.keys()
          ).join(', ')}`
        )
      }

      if (this.outRefs.has(refName)) {
        throw new Error(`Import reference '${refName}'`)
      }
      this.addOutRef(refName, template)
      template.addInRef(this.absolutePath, this)
    }
  }
}

export type TemplateWrapper = ElementWrapper<Template>
export type WorkflowWrapper = ElementWrapper<Workflow>

export interface CircularCheckContext {
  visited: Map<ElementWrapper<Template | Workflow>, boolean>
  remaining: ElementWrapper<Template | Workflow>[]
}
