# Chemin

Create infinite virtual subpaths for your React webapp

```bash
npm i @hazae41/chemin
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/chemin)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Compatible with your framework
- Uses only web standards
- Infinite virtual subpaths
- Element coordinates to URL
- Search params to React state

## What?

This library allows you to create infinite virtual hash-based and search-based subpaths

e.g. `https://example.com/chat/#/settings/user?left=/tree&right=/page`

All the paths in this URL are easily routed and modified with React components

```
https://example.com/chat ┐
                         └ # = /settings/user ┐
                                              ├ left = /tree
                                              └ right = /page
```

This allows creating dialogs, subdialogs, things on left and right, and many more

## Usage

### Hash-based path

You can use `HashPathProvider` to provide a hash-based path for your app

```tsx
import { HashPathProvider } from "@hazae41/chemin"

export function App() {
  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!client)
    return null

  return <HashPathProvider>
    <Router />
  </HashPathProvider>
}
```

e.g. `https://example.com/app/#/this/is/the/pathname`

```tsx
console.log(usePathContext().unwrap().url.pathname)
```

This will display `/this/is/the/pathname`

### Root-based path

You can also provide root-based path for your app

#### Use Next.js router

```tsx
import { useRouter } from "next/router"

export function NextPathProvider(props: { children?: ReactNode }) {
  const router = useRouter()
  const { children } = props

  const [raw, setRaw] = useState<string>()

  useEffect(() => {
    const onRouteChangeComplete = () => setRaw(location.href)

    router.events.on("routeChangeComplete", onRouteChangeComplete)
    return () => router.events.off("routeChangeComplete", onRouteChangeComplete)
  }, [])

  useEffect(() => {
    const onHashChangeComplete = () => setRaw(location.href)

    router.events.on("hashChangeComplete", onHashChangeComplete)
    return () => router.events.off("hashChangeComplete", onHashChangeComplete)
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
```

```tsx
export function App() {
  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!client)
    return null

  return <NextPathProvider>
    <Router />
  </NextPathProvider>
}
```

#### Use Navigation API

This uses the modern [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) that only works on some browsers for now 

```tsx
import { RootPathProvider } from "@hazae41/chemin"

export function App() {
  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!client)
    return null

  return <RootPathProvider>
    <Router />
  </RootPathProvider>
}
```

e.g. `https://example.com/this/is/the/pathname`

```tsx
console.log(usePathContext().unwrap().url.pathname)
```

This will display `/this/is/the/pathname`

You may need to disable client-side navigation from your framework

```tsx
declare const navigation: Nullable<any>

export default function App({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    /**
     * Disable Next.js client-side navigation
     */
    removeEventListener("popstate", router.onPopState)
  }, [router])

  useEffect(() => {
    /**
     * Enable modern client-side navigation
     */
    navigation?.addEventListener("navigate", (event: any) => event.intercept())
  }, [])

  return <Component {...pageProps} />
}
```

And rewrite all URLs to a common one

```tsx
rewrites() {
  return [
    {
      source: "/:path*",
      destination: "/",
    },
  ]
}
```

### Simple router

You can route things with `usePathContext()`

```tsx
import { usePathContext } from "@hazae41/chemin"

function Router() {
  const path = usePathContext().unwrap()

  if (path.url.pathname === "/home")
    return <HomePage />

  return <NotFoundPage />
}
```

### Pattern router

You can route things with pattern-matching via regexes

```tsx
import { usePathContext } from "@hazae41/chemin"

function Router() {
  const path = usePathContext().unwrap()

  let matches: RegExpMatchArray | null

  if ((matches = path.url.pathname.match(/^\/$/)))
    return <LandingPage />

  if (matches = path.url.pathname.match(/^\/home(\/)?$/))
    return <HomePage />

  if (matches = path.url.pathname.match(/^\/home\/settings(\/)?$/))
    return <HomeSettingsPage />

  if (matches = path.url.pathname.match(/^\/user\/([^\/]+)(\/)?$/))
    return <UserPage uuid={matches[1]} />

  return <NotFoundPage />
}
```

### Inline router

You can also route things inside a component

```tsx
import { usePathContext } from "@hazae41/chemin"

function FunPage() {
  const path = usePathContext().unwrap()

  return <>
    {path.url.pathname === "/help" &&
      <HelpDialog />}
    {path.url.pathname === "/send" &&
      <SendDialog />}
    <div>
      Have fun!
    </div>
  </>
}
```

### Navigation

You can use anchors and buttons to declaratively and imperatively navigate

```tsx
import { usePathContext } from "@hazae41/chemin"

function LandingPage() {
  const path = usePathContext().unwrap()

  const onHelpClick = useCallback(() => {
    location.replace(path.go("/help"))
  }, [path])

  return <>
    <div>
      Welcome!
    </div>
    <a href={path.go("/home").href}>
      Home
    </a>
    <button onClick={onHelpClick}>
      Help
    </button>
  </>
}
```

### Hash-based subpath

You can create hash-based subroutes

e.g. `https://example.com/home/#/secret`

```tsx
import { usePathContext, useHashSubpath, HashSubpathProvider } from "@hazae41/chemin"

function HomePageSubrouter() {
  const path = usePathContext().unwrap()

  if (path.url.pathname === "/secret")
    return <SecretDialog />

  return null
}

function HomePage() {
  const path = usePathContext().unwrap()
  const hash = useHashSubpath(path)

  const onSecretButtonClick = useCallback(() => {
    location.replace(hash.go("/secret"))
  }, [hash])

  return <>
    <HashSubpathProvider>
      <HomePageSubrouter />
    </HashSubpathProvider>
    <div>
      Hello world!
    </div>
    <a href={hash.go("/secret").href}>
      Secret anchor
    </a>
    <button onClick={onSecretButtonClick}>
      Secret button
    </button>
  </>
}
```

### Search-based subpath

You can create search-based subroutes

e.g. `https://example.com/home?left=/football&right=/baseball`

```tsx
import { usePathContext, useSearchSubpath, SearchSubpathProvider } from "@hazae41/chemin"

function PanelRouter() {
  const path = usePathContext().unwrap()

  if (path.url.pathname === "/football")
    return <FootballPanel />

  if (path.url.pathname === "/baseball")
    return <BaseballPanel />

  return <EmptyPanel />
}

function HomePage() {
  const path = usePathContext().unwrap()

  const left = useSearchSubpath(path, "left")
  const right = useSearchSubpath(path, "right")

  return <>
    <div>
      Hello world!
    </div>
    <a href={left.go("/football").href}>
      Show football on left
    </a>
    <a href={right.go("/baseball").href}>
      Show baseball on right
    </a>
    <div className="flex">
      <SearchSubpathProvider key="left">
        <PanelRouter />
      </SearchSubpathProvider>
      <SearchSubpathProvider key="right">
        <PanelRouter />
      </SearchSubpathProvider>
    </div>
  </>
}
```

### Search-based value

You can also create search-based non-path values

```tsx
import { usePathContext, useSearchState } from "@hazae41/chemin"

function Page() {
  const path = usePathContext().unwrap()

  const user = useSearchValue(path, "user")

  if (user.value === "root")
    return <>Hello root!</>

  return <a href={user.set("root").href}>
    Login as root
  </a>
}
```

### Search-based state

You can even create search-based non-path React state

```tsx
import { usePathContext, useSearchState } from "@hazae41/chemin"

function Page() {
  const path = usePathContext().unwrap()

  const [counter, setCounter] = useSearchState(path, "counter")

  const onClick = useCallback(() => {
    setCounter(previous => String(Number(previous) + 1))
  }, [])

  return <button onClick={onClick}>
    Add
  </button>
}
```

### Coords

You can use `useCoords(path, url)` with an HTML element to pass the element's X-Y coordinates to the URL

```tsx
function Page() {
  const path = usePathContext().unwrap()
  const hash = useHashSubpath(path)

  const settings = useCoords(hash, "/settings")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/settings" &&
        <Dialog>
          Settings
        </Dialog>}
    </HashSubpathProvider>
    <a className="anchor"
      href={settings.href}
      onClick={settings.onClick}
      onKeyDown={settings.onKeyDown}>
      Open settings
    </a>
  </>
}
```

Then you can consume those coordinates to add fancy animations and positioning

```tsx
function Dialog(props: ChildrenProps) {
  const { children } = props

  const path = usePathContext().unwrap()
  
  const x = path.url.searchParams.get("x") || 0
  const y = path.url.searchParams.get("x") || 0

  return <div style={{ "--x": `${x}px`, "--y": `${y}px` }}>
    <div className="dialog">
      {children}
    </div>
  </div>
}
```

Hint: `x` is `element.clientX` and `y` is `element.clientY`

You can also navigate on right-click using `onContextMenu`

```tsx
function Page() {
  const path = usePathContext().unwrap()
  const hash = useHashSubpath(path)

  const menu = useCoords(hash, "/menu")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/menu" &&
        <Menu>
          <button>Share</button>
        </Menu>}
    </HashSubpathProvider>
    <div className="card"
      onContextMenu={menu.onContextMenu}>
      Right-click me
    </div>
  </>
}
```

### Closeful

All providers of `PathContext` are also providers of [`CloseContext`](https://github.com/hazae41/react-close-context)

You can use the provided `CloseContext` to go back to the root of the current path

e.g. `https://example.com/home/#/aaa/bbb/ccc` -> `https://example.com/home`

e.g. `https://example.com/home/#/aaa/#/bbb/#/ccc` -> `https://example.com/home/#/aaa/#/bbb`

You can consume `CloseContext` in any component with a `close()` feature

```tsx
import { useCloseContext } from "@hazae41/chemin"

function Dialog(props: ChildrenProps) {
  const { children } = props

  const close = useCloseContext().unwrap()

  const onClose = useCallback(() => {
    close()
  }, [close])
  
  return <div>
    <button onClick={onClose}>
      Close
    </button>
    <div>
      {children}
    </div>
  </div>
}
```