// deno-lint-ignore-file no-explicit-any

import { Nullable } from "@/libs/nullable/mod.ts"

/**
 * Get the URL of the given path and query
 * @param hrefOrUrl 
 * @param search 
 * @returns 
 */
export function urlOf(hrefOrUrl: string | URL, search: Record<string, Nullable<any>> = {}) {
  const url = new URL(hrefOrUrl, location.href)

  for (const key in search)
    if (search[key] == null)
      url.searchParams.delete(key)
    else
      url.searchParams.set(key, search[key])

  return url
}

/**
 * Get the path of the given URL
 * @param hrefOrUrl 
 * @returns `/path?key=value#hash`
 */
export function pathOf(hrefOrUrl: string | URL) {
  const url = new URL(hrefOrUrl, location.href)

  if (url.origin !== location.origin)
    return url.href

  return url.pathname + url.search + url.hash
}

/**
 * Spoof a new URL from the hash and origin of the given URL
 * @param hrefOrUrl 
 * @returns 
 */
export function hashAsUrl(hrefOrUrl: string | URL) {
  const url = new URL(hrefOrUrl, location.href)
  const hash = url.hash.slice(1)

  if (hash)
    return new URL(hash, url.href)

  return new URL("/", url.href)
}

/**
 * Spoof a new URL from the search and origin of the given URL
 * @param hrefOrUrl 
 * @param key 
 * @returns 
 */
export function searchAsUrl(hrefOrUrl: string | URL, key: string) {
  const url = new URL(hrefOrUrl, location.href)
  const value = url.searchParams.get(key)

  if (value)
    return new URL(value, url.href)

  return new URL("/", url.href)
}
