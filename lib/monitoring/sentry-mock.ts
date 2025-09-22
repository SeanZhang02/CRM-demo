/**
 * Temporary Sentry Mock for Development
 * This file provides no-op implementations of Sentry functions during development
 * Replace with real Sentry when production monitoring is configured
 */

const noop = () => {}
const noopWithReturn = (value: any) => value

export const init = noop
export const captureException = noop
export const captureMessage = noop
export const addBreadcrumb = noop
export const setUser = noop
export const setTag = noop
export const setLevel = noop
export const setExtras = noop
export const withScope = (callback: (scope: any) => void) => callback({
  setUser: noop,
  setTag: noop,
  setLevel: noop,
  setExtras: noop
})

export const BrowserTracing = class {
  constructor(_options?: any) {}
}

export const Replay = class {
  constructor(_options?: any) {}
}

export const nextRouterInstrumentation = () => ({})

export default {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setLevel,
  setExtras,
  withScope,
  BrowserTracing,
  Replay,
  nextRouterInstrumentation
}