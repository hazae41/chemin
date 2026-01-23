// deno-lint-ignore-file no-explicit-any

/// <reference lib="dom" />

import { Nullable } from "@/libs/nullable/mod.ts"
import { ChildrenProps, Setter, State } from "@/libs/react/mod.ts"
import { hashAsUrl, pathOf, searchAsUrl, urlOf } from "@/libs/url/mod.ts"
import { CloseContext } from "@hazae41/react-close-context"
import { Option } from "@hazae41/result-and-option"
import * as React from "react"
import { createContext, KeyboardEvent, MouseEvent, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

React;

declare const navigation: Nullable<any>

export interface PathHandle {
  /**
   * The current relative URL
   */
  readonly url: URL

  /**
   * The pending relative URL
   */
  get(): URL

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

export function PathProvider(props: ChildrenProps & { value: PathHandle }) {
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

  const get = useCallback(() => {
    return new URL(location.href)
  }, [raw])

  const url = useMemo(() => {
    return get()
  }, [get])

  const go = useCallback((hrefOrUrl: string | URL) => {
    return new URL(hrefOrUrl, location.href)
  }, [])

  return useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])
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

  const get = useCallback(() => {
    return hashAsUrl(location.href)
  }, [raw])

  const url = useMemo(() => {
    return get()
  }, [get])

  const go = useCallback((hrefOrUrl: string | URL) => {
    const url = new URL(location.href)
    url.hash = `#${pathOf(hrefOrUrl)}`
    return url
  }, [])

  return useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])
}

/**
 * Provide a subpath as the path context along with a close context that goes to the root of the subpath
 * @param props 
 * @returns 
 */
export function SubpathProvider(props: ChildrenProps & { value: PathHandle }) {
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
  const get = useCallback(() => {
    return hashAsUrl(path.get())
  }, [path])

  const url = useMemo(() => {
    return get()
  }, [get])

  const go = useCallback((hrefOrUrl: string | URL) => {
    const url = path.get()
    url.hash = `#${pathOf(hrefOrUrl)}`
    return path.go(url)
  }, [path])

  return useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])
}

/**
 * Get a search-based subpath from the given path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchSubpath(path: PathHandle, key: string): PathHandle {
  const get = useCallback(() => {
    return searchAsUrl(path.get(), key)
  }, [key, path])

  const url = useMemo(() => {
    return get()
  }, [get])

  const go = useCallback((hrefOrUrl: string) => {
    const url = path.get()
    url.searchParams.set(key, pathOf(hrefOrUrl))
    return path.go(url)
  }, [key, path])

  return useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])
}

/**
 * Get a search-based value from the given path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchValue(path: PathHandle, key: string) {
  const get = useCallback(() => {
    return path.get().searchParams.get(key)
  }, [key, path])

  const value = useMemo(() => {
    return get()
  }, [get])

  const set = useCallback((value: Nullable<string>) => {
    const url = path.get()

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
export function useSearchState(path: PathHandle, key: string): State<Nullable<string>> {
  const state = useMemo(() => {
    return path.get().searchParams.get(key)
  }, [path, key])

  const setStateRef = useRef<Setter<Nullable<string>>>(null)

  setStateRef.current = useCallback((action: SetStateAction<Nullable<string>>) => {
    const url = path.get()

    const prev = url.searchParams.get(key)

    const next = typeof action === "function"
      ? action(prev)
      : action

    if (next == null)
      url.searchParams.delete(key)
    else
      url.searchParams.set(key, next)

    location.replace(path.go(url))
  }, [key, path])

  const setState = useCallback((action: SetStateAction<Nullable<string>>) => {
    setStateRef.current?.(action)
  }, [])

  return [state, setState]
}

/**
 * Pass the coordinates of HTML anchor events to the given URL and replace-navigate to it relative to the given path
 * @param path 
 * @param hrefOrUrl 
 * @returns 
 */
export function useAnchorWithCoords(path: PathHandle, hrefOrUrl: Nullable<string | URL>) {
  const url = useMemo(() => {
    if (hrefOrUrl == null)
      return
    return path.go(hrefOrUrl)
  }, [hrefOrUrl, path])

  const onClick = useCallback((e: MouseEvent) => {
    if (e.button !== 0)
      return
    if (hrefOrUrl == null)
      return

    e.preventDefault()

    const x = e.clientX
    const y = e.clientY

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    if (hrefOrUrl == null)
      return

    e.preventDefault()

    const box = e.currentTarget.getBoundingClientRect()

    const x = box.x + (box.width / 2)
    const y = box.y + (box.height / 2)

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  const onContextMenu = useCallback((e: MouseEvent) => {
    if (hrefOrUrl == null)
      return

    e.preventDefault()

    const x = e.clientX
    const y = e.clientY

    location.replace(path.go(urlOf(hrefOrUrl, { x, y })))
  }, [hrefOrUrl, path])

  return useMemo(() => {
    return { onClick, onKeyDown, onContextMenu, url }
  }, [onClick, onKeyDown, onContextMenu, url])
}