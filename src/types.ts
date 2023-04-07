import {
  combineObjects,
  getFilenameWithoutExtension,
  isExtendedJob
} from './utils'
import {
  GithubWorkflow,
  NormalJob,
  ReusableWorkflowCallJob
} from './schema/github-workflow'

interface ImportWithRef {
  ref: string
  path: string
}

export interface ExtendedJob extends NormalJob {
  extends: string
}

export interface ExtendedReusableWorkflowCallJob
  extends ReusableWorkflowCallJob {
  extends: string
}

export type Job =
  | NormalJob
  | ReusableWorkflowCallJob
  | ExtendedJob
  | ExtendedReusableWorkflowCallJob

export interface Template {
  imports?: string[] | ImportWithRef[]
  jobs: {
    [k: string]: Job
  }
}

interface BuildContext<T> {
  templatesByFilename: Map<string, T>
}

interface Builder<T> {
  buildOuterReferences(context: BuildContext<T>): void
}

export class TemplateWrapper implements Builder<TemplateWrapper> {
  private readonly name: string
  private readonly template: Template

  private readonly outRefs: Map<string, TemplateWrapper> = new Map()
  private readonly inRefs: Map<string, TemplateWrapper> = new Map()

  private readonly cache: Map<string, Job> = new Map()

  constructor(name: string, template: Template) {
    this.name = name
    this.template = template
  }

  getName(): string {
    return this.name
  }

  getTemplate(): Template {
    return this.template
  }

  getOutRefs(): Map<string, TemplateWrapper> {
    return this.outRefs
  }

  private addOutRef(ref: string, template: TemplateWrapper): void {
    this.outRefs.set(ref, template)
  }

  private addInRef(path: string, template: TemplateWrapper): void {
    this.inRefs.set(path, template)
  }

  private getObject(identifier: string): Job {
    if (this.cache.has(identifier)) {
      return this.cache.get(identifier)!
    }

    let job = this.template.jobs[identifier]
    if (!job) {
      throw new Error(
        `Object '${identifier}' not found in template '${this.name}'`
      )
    }

    if (isExtendedJob(job)) {
      const parentRef = job.extends
      const templateRef = parentRef.split('/')[0]
      const objectRef = parentRef.split('/')[1]
      const template = this.outRefs.get(templateRef)
      if (!template) {
        throw new Error(
          `Cannot extend '${parentRef}' in template '${this.name}': template '${templateRef}' was not imported`
        )
      }

      const parentObject = template.getObject(objectRef)
      job = combineObjects(parentObject, job)
    }

    this.cache.set(identifier, job)
    return job
  }

  /**
   * Updates the outer references of this template using the given context.
   * @param context The global context
   */
  buildOuterReferences(context: BuildContext<TemplateWrapper>): void {
    if (!this.template.imports) {
      // No imports, nothing to do
      return
    }

    for (const imported of this.template.imports) {
      let templateName: string
      if (typeof imported === 'string') {
        // Import without ref, defaults to the filename
        templateName = imported
      } else {
        // Import with path
        templateName = imported.path
      }
      templateName = getFilenameWithoutExtension(templateName)

      const template = context.templatesByFilename.get(templateName)
      if (!template) {
        throw new Error(`Template '${templateName}' not found`)
      }

      this.addOutRef(templateName, template)
      template.addInRef(this.name, this)
    }
  }
}

export interface CircularCheckContext {
  visited: Map<TemplateWrapper, boolean>
  remaining: TemplateWrapper[]
}

export interface Workflow extends GithubWorkflow {
  imports?: string[] | ImportWithRef[]
  jobs: {
    [k: string]: Job
  }
}
