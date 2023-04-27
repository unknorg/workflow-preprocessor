import {
  info as actionsInfo,
  debug as actionsDebug,
  error as actionsError,
  warning as actionsWarning
} from '@actions/core'
import {Logger} from 'tslog'
import {get as getConfig} from './config'

/** Log Levels:
 * 0: silly, 1: trace, 2: debug, 3: info, 4: warn, 5: error, 6: fatal.
 *
 * Default level: info.
 */
function parseLevel(level: string): number {
  const parsed = [
    'silly',
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal'
  ].indexOf(level)
  return parsed !== -1 ? parsed : 3
}
let level: number | undefined = undefined
const logLevel = (): number =>
  level ?? (level = parseLevel(getConfig('logLevel')))

const isRunningOnRunner = process.env['GITHUB_ACTIONS'] === 'true'

const useCustomLogger =
  !isRunningOnRunner || getConfig('useCustomLogger').toLowerCase() === 'true'
let customLogger: Logger<string> | undefined = undefined
if (useCustomLogger) {
  customLogger = new Logger({
    minLevel: logLevel()
  })
}

export const error = (message: string): void => {
  if (useCustomLogger) {
    customLogger?.error(message)
  } else {
    actionsError(message)
  }
}

export const warn = (message: string): void => {
  if (useCustomLogger) {
    customLogger?.warn(message)
  } else {
    actionsWarning(message)
  }
}

export const info = (message: string): void => {
  if (useCustomLogger) {
    customLogger?.info(message)
  } else {
    actionsInfo(message)
  }
}

export const debug = (message: string): void => {
  if (useCustomLogger) {
    customLogger?.debug(message)
  } else {
    actionsDebug(message)
  }
}

export const trace = (message: string): void => {
  if (useCustomLogger) {
    customLogger?.trace(message)
  } else {
    actionsDebug(`[TRACE] ${message}`)
  }
}
