import "@/styles/globals.css";
import { Nullable } from "@hazae41/option";
import { AppProps } from "next/app";
import { useEffect } from "react";

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
     * Use modern client-side navigation
     */
    navigation?.addEventListener("navigate", (event: any) => event.intercept())
  }, [])

  return <Component {...pageProps} />
}
