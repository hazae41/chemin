import { RootPathProvider, usePathContext } from "@hazae41/chemin";
import { Nullable } from "@hazae41/option";
import { useEffect } from "react";

declare const navigation: Nullable<any>

export default function Home() {
  useEffect(() => {
    /**
     * Only client-side navigation
     */
    navigation?.addEventListener("navigate", (event: any) => event.intercept())
  }, [])

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

  return <a onClick={() => navigation?.navigate("/a/long/path")}>
    Click me
  </a>
}