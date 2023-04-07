import {
  GithubWorkflow,
  NormalJob,
  ReusableWorkflowCallJob
} from './github-workflow'

export interface ImportWithRef {
  ref: string
  path: string
}

export interface ExtendedJob extends Partial<NormalJob> {
  extends: string
}

export interface ExtendedReusableWorkflowCallJob
  extends Partial<ReusableWorkflowCallJob> {
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export interface Workflow extends GithubWorkflow {
  imports?: string[] | ImportWithRef[]
  jobs: {
    [k: string]: Job
  }
}
