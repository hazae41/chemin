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

## What?

This library allows you to create infinite virtual hash-based and search-based subpaths

e.g. `https://example.com/chat/#/settings/user?left=/tree&right=/page`

All the paths in this URL are easily routed with React components

```
https://example.com/chat ┐
                         └ # = /settings/user ┐
                                              ├ left = /tree
                                              └ right = /page
```

This allows creating dialogs and subdialogs with things on left and right

## Usage

### Simple router

You can route things with `usePathContext()`

```tsx
import { usePathContext } from "@hazae41/chemin"

function Router() {
  const { url } = usePathContext().unwrap()

  if (url.pathname === "/home")
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

You can route things inside a component

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

### Search-based subrouter

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

### CloseContext

All providers of `PathContext` are also providers of `CloseContext`

You can use the provided `CloseContext` to go back to the root of the current (sub)path

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

You can also provide `CloseContext` to perform your own logic

```tsx
import { CloseContext } from "@hazae41/chemin"

function FunPage() {
  const [open, setOpen] = useState(false)

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setOpen(false)
  }, [])

  return <>
    <CloseContext.Provider value={onClose}>
      {open && 
        <Dialog>
          Hi
        </Dialog>}
    </CloseContext.Provider>
    <button onClick={onOpen}>
      Fun?
    </button>
  </>
}
```

### KeyValue state

You can transform search parameters into a key-value state object

```tsx
function Page() {
  const path = usePathContext().unwrap()

  const [search, setSearch] = useSearchAsKeyValueState(path)

  const onClick = useCallback(() => {
    setSearch(search => ({ ...search, key: "value" }))
  }, [setSearch])

  return <button onClick={onClick}>
    Click me
  </button>
}
```