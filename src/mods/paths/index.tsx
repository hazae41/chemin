import * as React from "react"

import { Nullable, Option, Optional } from "@hazae41/option"
import { ChildrenProps } from "libs/react/index.js"
import { CloseContext } from "mods/close/index.js"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export function hash(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  const hash = url.hash.slice(1)

  if (hash)
    return new URL(hash, url.origin)

  return new URL(url.origin)
}

export function search(pathOrUrl: string | URL, key: string) {
  const url = new URL(pathOrUrl, location.href)
  const value = url.searchParams.get(key)

  if (value)
    return new URL(value, url.origin)

  return new URL(url.origin)
}

export function pathOf(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  return url.pathname + url.search + url.hash
}

export interface PathHandle {
  /**
   * The relative URL
   */
  readonly url: URL

  /**
   * The absolute url if we go to the given path
   * @param path 
   */
  go(pathOrUrl: string | URL): URL
}

export const PathContext =
  createContext<Nullable<PathHandle>>(undefined)

export function usePathContext() {
  return Option.wrap(useContext(PathContext))
}

export function HashPathProvider(props: ChildrenProps) {
  const { children } = props

  const [raw, setRaw] = useState<string>()

  const url = useMemo(() => {
    if (raw == null)
      return
    return hash(raw)
  }, [raw])

  useEffect(() => {
    setRaw(location.href)

    const onHashChange = () => setRaw(location.href)

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

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

export function useHashSubpath(path: PathHandle): PathHandle {
  const url = useMemo(() => {
    return hash(path.url)
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

export function useSearchSubpath(path: PathHandle, key: string): PathHandle {
  const url = useMemo(() => {
    return search(path.url, key)
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

export function useSearchAsKeyValueState<T extends Record<string, Optional<string>>>(path: PathHandle) {
  const current = useMemo(() => {
    return Object.fromEntries(path.url.searchParams) as T
  }, [path])

  const [pending, setPending] = useState<T>(current)

  /**
   * Immediatly update the pending state when the current state changes
   */
  useMemo(() => {
    setPending(current)
  }, [current])

  /**
   * Lazily update the current state when the pending state differs
   */
  useEffect(() => {
    if (pending === current)
      return

    const url = new URL(path.url.href)
    const entries = Object.entries(pending).filter(([_, value]) => value != null)
    url.search = new URLSearchParams(entries as any).toString()

    if (path.url.href === url.href)
      return

    location.replace(path.go(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  return [current, setPending] as const
}