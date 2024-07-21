import { Nullable, Option } from "@hazae41/option"
import { createContext, useContext } from "react"

export const CloseContext = createContext<Nullable<(force?: boolean) => void>>(undefined)

export function useCloseContext() {
  return Option.wrap(useContext(CloseContext))
}