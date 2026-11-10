// deno-lint-ignore-file no-explicit-any

/// <reference lib="dom" />

import { Nullable } from "@/libs/nullable/mod.ts"
import { hashAsUrl, pathOf, searchAsUrl, urlOf } from "@/libs/url/mod.ts"
import { CloseContext } from "@hazae41/react-close-context"
import { Option } from "@hazae41/result-and-option"
import * as React from "react"
import { createContext, Dispatch, KeyboardEvent, MouseEvent, ReactNode, SetStateAction, SubmitEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

React;

declare const navigation: Nullable<any>

export interface PathHandle {
  /**
   * The current relative URL
   */
  readonly url: URL

  /**
   * Get the absolute URL if we would go to the given relative URL
   * @param hrefOrUrl
   */
  go(hrefOrUrl: string | URL): URL

}

export interface ValueHandle {
  /**
   * The current value
   */
  readonly value: Nullable<string>

  /**
   * The pending value
   */
  get(): Nullable<string>

  /**
   * Get the absolute URL if we would set the value to the given value
   * @param hrefOrUrl
   */
  set(value: Nullable<string>): URL
}

export const PathContext =
  createContext<Nullable<PathHandle>>(undefined)

export function usePathContext() {
  return Option.wrap(useContext(PathContext))
}

export function PathProvider(props: { children?: ReactNode } & { value: PathHandle }) {
  const { children, value } = props

  const close = useCallback(() => {
    location.replace(value.go("/"))
  }, [value])

  return <PathContext.Provider value={value}>
    <CloseContext.Provider value={close}>
      {children}
    </CloseContext.Provider>
  </PathContext.Provider>
}

/**
 * Root path using the modern Navigation API
 * @param props 
 * @returns 
 */
export function usePath(): PathHandle {
  const [raw, setRaw] = useState<string>()

  useEffect(() => {
    const onCurrentEntryChange = () => setRaw(location.href)

    navigation?.addEventListener("currententrychange", onCurrentEntryChange, { passive: true })
    return () => navigation?.removeEventListener("currententrychange", onCurrentEntryChange)
  }, [])

  const url = useMemo(() => {
    return new URL(location.href)
  }, [raw])

  const go = useCallback((hrefOrUrl: string | URL) => {
    return new URL(hrefOrUrl, location.href)
  }, [])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

/**
 * Hash-based root path using the legacy `hashchange`
 * @param props 
 * @returns 
 */
export function useHashPath(): PathHandle {
  const [raw, setRaw] = useState<string>()

  useEffect(() => {
    const onHashChange = () => setRaw(location.href)

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  const url = useMemo(() => {
    return hashAsUrl(location.href)
  }, [raw])

  const go = useCallback((hrefOrUrl: string | URL) => {
    const url = new URL(location.href)
    url.hash = pathOf(hrefOrUrl)
    return url
  }, [])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

/**
 * Provide a subpath as the path context along with a close context that goes to the root of the subpath
 * @param props 
 * @returns 
 */
export function SubpathProvider(props: { children?: ReactNode } & { value: PathHandle }) {
  const { children, value } = props

  const close = useCallback(() => {
    location.replace(value.go("/"))
  }, [value])

  return <PathContext.Provider value={value}>
    <CloseContext.Provider value={close}>
      {children}
    </CloseContext.Provider>
  </PathContext.Provider>
}

/**
 * Get a hash-based subpath from the given path
 * @param path 
 * @returns 
 */
export function useHashSubpath(path: PathHandle): PathHandle {
  const url = useMemo(() => {
    return hashAsUrl(path.url)
  }, [path])

  const go = useCallback((hrefOrUrl: string | URL) => {
    const url = path.url
    url.hash = pathOf(hrefOrUrl)
    return path.go(url)
  }, [path])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

/**
 * Get a search-based subpath from the given path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchSubpath(path: PathHandle, key: string): PathHandle {
  const url = useMemo(() => {
    return searchAsUrl(path.url, key)
  }, [key, path])

  const go = useCallback((hrefOrUrl: string) => {
    const url = path.url
    url.searchParams.set(key, pathOf(hrefOrUrl))
    return path.go(url)
  }, [key, path])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

/**
 * Get a search-based value from the given path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchValue(path: PathHandle, key: string) {
  const get = useCallback(() => {
    return path.url.searchParams.get(key)
  }, [key, path])

  const value = useMemo(() => {
    return get()
  }, [get])

  const set = useCallback((value: Nullable<string>) => {
    const url = path.url

    if (value == null)
      url.searchParams.delete(key)
    else
      url.searchParams.set(key, value)

    return path.go(url)
  }, [key, path])

  return useMemo(() => {
    return { value, get, set } satisfies ValueHandle
  }, [value, get, set])
}

/**
 * Get a search-based state from the given path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchState(path: PathHandle, key: string) {
  const state = useMemo(() => {
    return path.url.searchParams.get(key)
  }, [path, key])

  const setStateRef = useRef<Dispatch<SetStateAction<Nullable<string>>>>(null)

  setStateRef.current = useCallback((value: SetStateAction<Nullable<string>>) => {
    const url = path.url

    const prev = url.searchParams.get(key)

    const next = typeof value === "function"
      ? value(prev)
      : value

    if (next == null)
      url.searchParams.delete(key)
    else
      url.searchParams.set(key, next)

    location.replace(path.go(url))
  }, [key, path])

  const setState = useCallback((value: SetStateAction<Nullable<string>>) => {
    setStateRef.current?.(value)
  }, [])

  return [state, setState] as const
}

export interface LinkWithCoords {

  /**
   * Relative URL for routing
   */
  readonly rel: URL

  /**
   * Absolute URL for navigating
   */
  readonly abs: URL

  onClick(e: MouseEvent): void

  onContextMenu(e: MouseEvent): void

  onKeyDown(e: KeyboardEvent): void

  onSubmit(e: SubmitEvent): void

}

/**
 * Pass the coordinates of HTML events to the given URL and replace-navigate to it relative to the given path
 * @param path 
 * @param hrefOrUrl 
 * @returns 
 */
export function useLinkWithCoords(path: PathHandle, hrefOrUrl: string | URL): LinkWithCoords {
  const rel = useMemo(() => {
    return new URL(hrefOrUrl, location.href)
  }, [hrefOrUrl, path])

  const abs = useMemo(() => {
    return path.go(hrefOrUrl)
  }, [hrefOrUrl, path])

  const onClick = useCallback((e: MouseEvent) => {
    if (e.button !== 0)
      return

    e.preventDefault()

    const box = e.currentTarget.getBoundingClientRect()

    const x = e.clientX || (box.x + (box.width / 2))
    const y = e.clientY || (box.y + (box.height / 2))

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  const onContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()

    const box = e.currentTarget.getBoundingClientRect()

    const x = e.clientX || (box.x + (box.width / 2))
    const y = e.clientY || (box.y + (box.height / 2))

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return

    e.preventDefault()

    const box = e.currentTarget.getBoundingClientRect()

    const x = box.x + (box.width / 2)
    const y = box.y + (box.height / 2)

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  const onSubmit = useCallback((e: SubmitEvent) => {
    e.preventDefault()

    const box = e.currentTarget.getBoundingClientRect()

    const x = box.x + (box.width / 2)
    const y = box.y + (box.height / 2)

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  return useMemo(() => {
    return { rel, abs, onClick, onKeyDown, onContextMenu, onSubmit } satisfies LinkWithCoords
  }, [rel, abs, onClick, onKeyDown, onContextMenu, onSubmit])
}