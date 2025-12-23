import { Dispatch, ReactNode, SetStateAction } from "react";

export type Setter<T> = Dispatch<SetStateAction<T>>

export type State<T> = readonly [T, Setter<T>]

export interface ChildrenProps {
  readonly children?: ReactNode
}