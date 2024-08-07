import * as React from "react"

import { Nullable, Option, Optional } from "@hazae41/option"
import { CloseContext } from "@hazae41/react-close-context"
import { ChildrenProps } from "libs/react/index.js"
import { hashAsUrl, pathOf, searchAsUrl, urlOf } from "libs/url/index.js"
import { createContext, KeyboardEvent, useCallback, useContext, useEffect, useMemo, useState } from "react"

declare const navigation: Nullable<any>

export interface PathHandle {
  /**
   * The current relative URL of this path
   */
  readonly url: URL

  /**
   * The current pending URL of this path
   */
  get(): URL

  /**
   * Get the absolute URL if we would go to the given relative URL of this path
   * @param hrefOrUrl
   */
  go(hrefOrUrl: string | URL): URL
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
    return new URL(`#${pathOf(hrefOrUrl)}`, location.href)
  }, [])

  const handle = useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])

  return <PathContext.Provider value={handle}>
    {children}
  </PathContext.Provider>
}

/**
 * Get a hash-based subpath from the current path
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
    const next = path.get()
    next.hash = pathOf(hrefOrUrl)
    return path.go(next)
  }, [path])

  return useMemo(() => {
    return { url, get, go } satisfies PathHandle
  }, [url, get, go])
}

/**
 * Get a search-based subpath from the current path
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
    const next = path.get()
    next.searchParams.set(key, pathOf(hrefOrUrl))
    return path.go(next)
  }, [key, path])

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

  const path = usePathContext().unwrap()
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
 * Provide a search-based subpath from the current path along with a close context
 * @param props 
 * @returns 
 */
export function SearchSubpathProvider(props: ChildrenProps & { readonly key: string }) {
  const { children, key } = props

  const path = usePathContext().unwrap()
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
 * Pass the coordinates of the events to the given url and navigate to it relative to the given path
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

/**
 * Transform the search of the current path into a key-value state
 * @param path 
 * @returns 
 */
export function useSearchAsKeyValueState<T extends Record<string, Optional<string>>>(path: PathHandle) {
  const current = useMemo(() => {
    return Object.fromEntries(path.url.searchParams) as T
  }, [path])

  const [pending, setPending] = useState<T>(current)

  useMemo(() => {
    setPending(current)
  }, [current])

  useEffect(() => {
    if (pending === current)
      return

    const url = urlOf(path.url, pending)

    if (path.url.href === url.href)
      return

    location.replace(path.go(url))
  }, [pending])

  return [current, setPending] as const
}