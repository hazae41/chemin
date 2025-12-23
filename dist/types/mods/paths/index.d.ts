import * as React from 'react';
import { SetStateAction, MouseEvent, KeyboardEvent } from 'react';
import { Nullable, Option } from '@hazae41/option';
import { ChildrenProps } from '../../libs/react/index.js';

interface PathHandle {
    /**
     * The current relative URL
     */
    readonly url: URL;
    /**
     * The pending relative URL
     */
    get(): URL;
    /**
     * Get the absolute URL if we would go to the given relative URL
     * @param hrefOrUrl
     */
    go(hrefOrUrl: string | URL): URL;
}
interface ValueHandle {
    /**
     * The current value
     */
    readonly value: Nullable<string>;
    /**
     * The pending value
     */
    get(): Nullable<string>;
    /**
     * Get the absolute URL if we would set the value to the given value
     * @param hrefOrUrl
     */
    set(value: Nullable<string>): URL;
}
declare const PathContext: React.Context<Nullable<PathHandle>>;
declare function usePathContext(): Option<PathHandle>;
/**
 * Root-based path provider using the modern Navigation API
 * @param props
 * @returns
 */
declare function RootPathProvider(props: ChildrenProps): React.JSX.Element;
/**
 * Hash-based subpath provider using the legacy `hashchange`
 * @param props
 * @returns
 */
declare function HashPathProvider(props: ChildrenProps): React.JSX.Element;
/**
 * Get a hash-based subpath from the given path
 * @param path
 * @returns
 */
declare function useHashSubpath(path: PathHandle): PathHandle;
/**
 * Provide a hash-based subpath from the current path along with a close context
 * @param props
 * @returns
 */
declare function HashSubpathProvider(props: ChildrenProps): React.JSX.Element;
/**
 * Get a search-based subpath from the given path
 * @param path
 * @param key
 * @returns
 */
declare function useSearchSubpath(path: PathHandle, key: string): PathHandle;
/**
 * Get a search-based value from the given path
 * @param path
 * @param key
 * @returns
 */
declare function useSearchValue(path: PathHandle, key: string): {
    value: string | null;
    get: () => string | null;
    set: (value: Nullable<string>) => URL;
};
/**
 * Get a search-based state from the given path
 * @param path
 * @param key
 * @returns
 */
declare function useSearchState(path: PathHandle, key: string): [string | null, (action: SetStateAction<Nullable<string>>) => void];
/**
 * Provide a search-based subpath from the current path along with a close context
 * @param props
 * @returns
 */
declare function SearchSubpathProvider(props: ChildrenProps & {
    readonly value: string;
}): React.JSX.Element;
/**
 * Pass the coordinates of the events to the given URL and replace-navigate to it relative to the given path
 * @param path
 * @param hrefOrUrl
 * @returns
 */
declare function useCoords(path: PathHandle, hrefOrUrl: Nullable<string | URL>): {
    onClick: (e: MouseEvent) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onContextMenu: (e: MouseEvent) => void;
    href: string | undefined;
};

export { HashPathProvider, HashSubpathProvider, PathContext, type PathHandle, RootPathProvider, SearchSubpathProvider, type ValueHandle, useCoords, useHashSubpath, usePathContext, useSearchState, useSearchSubpath, useSearchValue };
