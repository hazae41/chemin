/**
 * Get the path of the given URL
 * @param pathOrUrl 
 * @returns `/path?key=value#hash`
 */
export function pathOf(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  return url.pathname + url.search + url.hash
}

/**
 * Spoof a new URL from the hash and origin of the given URL
 * @param pathOrUrl 
 * @returns 
 */
export function hashAsUrl(pathOrUrl: string | URL) {
  const url = new URL(pathOrUrl, location.href)
  const hash = url.hash.slice(1)

  if (hash)
    return new URL(hash, url.origin)

  return new URL(url.origin)
}

/**
 * Spoof a new URL from the search and origin of the given URL
 * @param pathOrUrl 
 * @param key 
 * @returns 
 */
export function searchAsUrl(pathOrUrl: string | URL, key: string) {
  const url = new URL(pathOrUrl, location.href)
  const value = url.searchParams.get(key)

  if (value)
    return new URL(value, url.origin)

  return new URL(url.origin)
}