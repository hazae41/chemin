import { RootPathProvider, usePathContext } from "@hazae41/chemin";

export default function Page() {
  return <RootPathProvider>
    <Router />
  </RootPathProvider>
}

export function Router() {
  const path = usePathContext().unwrap()

  if (path.url.pathname === "/a/long/path")
    return <div>Hello world!</div>

  if (path.url.hash === "#secret")
    return <div>Access granted!</div>

  return <a href={path.go("/a/long/path").href}>
    Click me
  </a>
}