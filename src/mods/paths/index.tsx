import * as React from "react"

import { Nullable, Option } from "@hazae41/option"
import { CloseContext } from "@hazae41/react-close-context"
import { ChildrenProps, Setter, State } from "libs/react/index.js"
import { hashAsUrl, pathOf, searchAsUrl, urlOf } from "libs/url/index.js"
import { createContext, KeyboardEvent, MouseEvent, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

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

/**
 * Root-based path provider using the modern Navigation API
 * @param props 
 * @returns 
 */
export function RootPathProvider(props: ChildrenProps) {
  const { children } = props

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

  const handle = useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])

  return <PathContext.Provider value={handle}>
    {children}
  </PathContext.Provider>
}

/**
 * Hash-based subpath provider using the legacy `hashchange`
 * @param props 
 * @returns 
 */
export function HashPathProvider(props: ChildrenProps) {
  const { children } = props

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

  const handle = useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])

  return <PathContext.Provider value={handle}>
    {children}
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
 * Provide a hash-based subpath from the current path along with a close context
 * @param props 
 * @returns 
 */
export function HashSubpathProvider(props: ChildrenProps) {
  const { children } = props

  const path = usePathContext().getOrThrow()
  const hash = useHashSubpath(path)

  const onClose = useCallback(() => {
    location.replace(hash.go("/"))
  }, [hash])

  return <PathContext.Provider value={hash}>
    <CloseContext.Provider value={onClose}>
      {children}
    </CloseContext.Provider>
  </PathContext.Provider>
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
export function useSearchState(path: PathHandle, key: string) {
  const state = useMemo(() => {
    return path.get().searchParams.get(key)
  }, [path, key])

  const setStateRef = useRef<Setter<Nullable<string>>>()

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

  return [state, setState] satisfies State<Nullable<string>>
}

/**
 * Provide a search-based subpath from the current path along with a close context
 * @param props 
 * @returns 
 */
export function SearchSubpathProvider(props: ChildrenProps & { readonly key: string }) {
  const { children, key } = props

  const path = usePathContext().getOrThrow()
  const search = useSearchSubpath(path, key)

  const onClose = useCallback(() => {
    location.replace(search.go("/"))
  }, [search])

  return <PathContext.Provider value={search}>
    <CloseContext.Provider value={onClose}>
      {children}
    </CloseContext.Provider>
  </PathContext.Provider>
}

/**
 * Pass the coordinates of the events to the given URL and replace-navigate to it relative to the given path
 * @param path 
 * @param hrefOrUrl 
 * @returns 
 */
export function useCoords(path: PathHandle, hrefOrUrl: Nullable<string | URL>) {
  const href = useMemo(() => {
    if (hrefOrUrl == null)
      return
    return path.go(hrefOrUrl).href
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

    const x = e.currentTarget.getBoundingClientRect().x + (e.currentTarget.getBoundingClientRect().width / 2)
    const y = e.currentTarget.getBoundingClientRect().y + (e.currentTarget.getBoundingClientRect().height / 2)

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

  return { onClick, onKeyDown, onContextMenu, href }
}