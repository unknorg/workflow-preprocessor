import {
  GithubWorkflow,
  NormalJob,
  ReusableWorkflowCallJob
} from './github-workflow'

export interface ImportWithRef {
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

export interface Workflow extends GithubWorkflow {
  imports?: string[] | ImportWithRef[]
  jobs: {
    [k: string]: Job
  }
}
