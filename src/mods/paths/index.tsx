import * as React from "react"

import { Nullable, Option, Optional } from "@hazae41/option"
import { CloseContext } from "@hazae41/react-close-context"
import { ChildrenProps } from "libs/react/index.js"
import { hashAsUrl, pathOf, searchAsUrl } from "libs/url/index.js"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

declare const navigation: Nullable<any>

export interface PathHandle {
  /**
   * The relative URL of this path
   */
  readonly url: URL

  /**
   * Get the absolute URL if we would go to the given relative URL of this path
   * @param pathOrUrl
   */
  go(pathOrUrl: string | URL): URL
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
    setRaw(location.href)

    const onCurrentEntryChange = () => setRaw(location.href)

    navigation?.addEventListener("currententrychange", onCurrentEntryChange, { passive: true })
    return () => navigation?.removeEventListener("currententrychange", onCurrentEntryChange)
  }, [])

  const url = useMemo(() => {
    if (raw == null)
      return
    return new URL(raw, location.href)
  }, [raw])

  const go = useCallback((pathOrUrl: string | URL) => {
    return new URL(pathOrUrl, location.href)
  }, [])

  const handle = useMemo(() => {
    if (url == null)
      return
    return { url, go } satisfies PathHandle
  }, [url, go])

  if (handle == null)
    return null

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
    setRaw(location.href)

    const onHashChange = () => setRaw(location.href)

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  const url = useMemo(() => {
    if (raw == null)
      return
    return hashAsUrl(raw)
  }, [raw])

  const go = useCallback((pathOrUrl: string | URL) => {
    return new URL(`#${pathOf(pathOrUrl)}`, location.href)
  }, [])

  const handle = useMemo(() => {
    if (url == null)
      return
    return { url, go } satisfies PathHandle
  }, [url, go])

  if (handle == null)
    return null

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
  const url = useMemo(() => {
    return hashAsUrl(path.url)
  }, [path])

  const go = useCallback((pathOrUrl: string | URL) => {
    const next = new URL(path.url.href, location.href)
    next.hash = pathOf(pathOrUrl)
    return path.go(next)
  }, [path])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

/**
 * Get a search-based subpath from the current path
 * @param path 
 * @param key 
 * @returns 
 */
export function useSearchSubpath(path: PathHandle, key: string): PathHandle {
  const url = useMemo(() => {
    return searchAsUrl(path.url, key)
  }, [key, path])

  const go = useCallback((pathOrUrl: string) => {
    const next = new URL(path.url.href, location.href)
    next.searchParams.set(key, pathOf(pathOrUrl))
    return path.go(next)
  }, [key, path])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
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

    const url = new URL(path.url.href)
    const entries = Object.entries(pending).filter(([_, value]) => value != null)
    url.search = new URLSearchParams(entries as any).toString()

    if (path.url.href === url.href)
      return

    location.replace(path.go(url))
  }, [pending])

  return [current, setPending] as const
}