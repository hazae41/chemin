import { RootPathProvider, useHashSubpath, usePathContext, useSearchState, useSearchValue } from "@hazae41/chemin";
import { useCallback, useEffect, useState } from "react";

export default function Page() {
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

export function Router() {
  const path = usePathContext().unwrap()

  const hash = useHashSubpath(path)

  const user = useSearchValue(hash, "user")

  const [pass, setPass] = useSearchState(hash, "pass")

  const onSecretClick = useCallback(() => {
    location.assign(hash.go("/secret"))
    location.replace(user.set("root"))
    setPass(String(1234))
  }, [])

  if (path.url.pathname === "/a/long/path")
    return <div>Hello world!</div>

  if (path.url.pathname !== "/")
    return <div>404</div>

  if (hash.url.pathname === "/secret" && user.value === "root" && pass === "0000")
    return <div>Access granted!</div>

  return <div className="flex flex-col">
    <a className="w-full"
      href={path.go("/a/long/path").href}>
      Click me to go to /a/long/path
    </a>
    <button className="text-left w-full"
      onClick={onSecretClick}>
      Click me to go to /#/secret
    </button>
  </div>
}