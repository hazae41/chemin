import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Option } from '@hazae41/option';
import { CloseContext } from '@hazae41/react-close-context';
import { hashAsUrl, pathOf, searchAsUrl, urlOf } from '../../libs/url/index.mjs';

const PathContext = /*#__PURE__*/ createContext(undefined);
function usePathContext() {
    return Option.wrap(useContext(PathContext));
}
/**
 * Root-based path provider using the modern Navigation API
 * @param props 
 * @returns 
 */ function RootPathProvider(props) {
    const { children } = props;
    const [raw, setRaw] = useState();
    useEffect(()=>{
        const onCurrentEntryChange = ()=>setRaw(location.href);
        navigation?.addEventListener("currententrychange", onCurrentEntryChange, {
            passive: true
        });
        return ()=>navigation?.removeEventListener("currententrychange", onCurrentEntryChange);
    }, []);
    const get = useCallback(()=>{
        return new URL(location.href);
    }, [
        raw
    ]);
    const url = useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = useCallback((hrefOrUrl)=>{
        return new URL(hrefOrUrl, location.href);
    }, []);
    const handle = useMemo(()=>{
        return {
            url,
            get,
            go
        };
    }, [
        url,
        get,
        go
    ]);
    return /*#__PURE__*/ React.createElement(PathContext.Provider, {
        value: handle
    }, children);
}
/**
 * Hash-based subpath provider using the legacy `hashchange`
 * @param props 
 * @returns 
 */ function HashPathProvider(props) {
    const { children } = props;
    const [raw, setRaw] = useState();
    useEffect(()=>{
        const onHashChange = ()=>setRaw(location.href);
        addEventListener("hashchange", onHashChange, {
            passive: true
        });
        return ()=>removeEventListener("hashchange", onHashChange);
    }, []);
    const get = useCallback(()=>{
        return hashAsUrl(location.href);
    }, [
        raw
    ]);
    const url = useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = useCallback((hrefOrUrl)=>{
        const url = new URL(location.href);
        url.hash = `#${pathOf(hrefOrUrl)}`;
        return url;
    }, []);
    const handle = useMemo(()=>{
        return {
            url,
            get,
            go
        };
    }, [
        url,
        get,
        go
    ]);
    return /*#__PURE__*/ React.createElement(PathContext.Provider, {
        value: handle
    }, children);
}
/**
 * Get a hash-based subpath from the given path
 * @param path 
 * @returns 
 */ function useHashSubpath(path) {
    const get = useCallback(()=>{
        return hashAsUrl(path.get());
    }, [
        path
    ]);
    const url = useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = useCallback((hrefOrUrl)=>{
        const url = path.get();
        url.hash = `#${pathOf(hrefOrUrl)}`;
        return path.go(url);
    }, [
        path
    ]);
    return useMemo(()=>{
        return {
            url,
            get,
            go
        };
    }, [
        url,
        get,
        go
    ]);
}
/**
 * Provide a hash-based subpath from the current path along with a close context
 * @param props 
 * @returns 
 */ function HashSubpathProvider(props) {
    const { children } = props;
    const path = usePathContext().getOrThrow();
    const hash = useHashSubpath(path);
    const onClose = useCallback(()=>{
        location.replace(hash.go("/"));
    }, [
        hash
    ]);
    return /*#__PURE__*/ React.createElement(PathContext.Provider, {
        value: hash
    }, /*#__PURE__*/ React.createElement(CloseContext.Provider, {
        value: onClose
    }, children));
}
/**
 * Get a search-based subpath from the given path
 * @param path 
 * @param key 
 * @returns 
 */ function useSearchSubpath(path, key) {
    const get = useCallback(()=>{
        return searchAsUrl(path.get(), key);
    }, [
        key,
        path
    ]);
    const url = useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = useCallback((hrefOrUrl)=>{
        const url = path.get();
        url.searchParams.set(key, pathOf(hrefOrUrl));
        return path.go(url);
    }, [
        key,
        path
    ]);
    return useMemo(()=>{
        return {
            url,
            get,
            go
        };
    }, [
        url,
        get,
        go
    ]);
}
/**
 * Get a search-based value from the given path
 * @param path 
 * @param key 
 * @returns 
 */ function useSearchValue(path, key) {
    const get = useCallback(()=>{
        return path.get().searchParams.get(key);
    }, [
        key,
        path
    ]);
    const value = useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const set = useCallback((value)=>{
        const url = path.get();
        if (value == null) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
        return path.go(url);
    }, [
        key,
        path
    ]);
    return useMemo(()=>{
        return {
            value,
            get,
            set
        };
    }, [
        value,
        get,
        set
    ]);
}
/**
 * Get a search-based state from the given path
 * @param path 
 * @param key 
 * @returns 
 */ function useSearchState(path, key) {
    const state = useMemo(()=>{
        return path.get().searchParams.get(key);
    }, [
        path,
        key
    ]);
    const setStateRef = useRef();
    setStateRef.current = useCallback((action)=>{
        const url = path.get();
        const prev = url.searchParams.get(key);
        const next = typeof action === "function" ? action(prev) : action;
        if (next == null) url.searchParams.delete(key);
        else url.searchParams.set(key, next);
        location.replace(path.go(url));
    }, [
        key,
        path
    ]);
    const setState = useCallback((action)=>{
        setStateRef.current?.(action);
    }, []);
    return [
        state,
        setState
    ];
}
/**
 * Provide a search-based subpath from the current path along with a close context
 * @param props 
 * @returns 
 */ function SearchSubpathProvider(props) {
    const { children, value } = props;
    const path = usePathContext().getOrThrow();
    const search = useSearchSubpath(path, value);
    const onClose = useCallback(()=>{
        location.replace(search.go("/"));
    }, [
        search
    ]);
    return /*#__PURE__*/ React.createElement(PathContext.Provider, {
        value: search
    }, /*#__PURE__*/ React.createElement(CloseContext.Provider, {
        value: onClose
    }, children));
}
/**
 * Pass the coordinates of the events to the given URL and replace-navigate to it relative to the given path
 * @param path 
 * @param hrefOrUrl 
 * @returns 
 */ function useCoords(path, hrefOrUrl) {
    const href = useMemo(()=>{
        if (hrefOrUrl == null) return;
        return path.go(hrefOrUrl).href;
    }, [
        hrefOrUrl,
        path
    ]);
    const onClick = useCallback((e)=>{
        if (e.button !== 0) return;
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        location.replace(path.go(urlOf(hrefOrUrl, {
            x,
            y
        })));
    }, [
        hrefOrUrl,
        path
    ]);
    const onKeyDown = useCallback((e)=>{
        if (e.key !== "Enter") return;
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.currentTarget.getBoundingClientRect().x + e.currentTarget.getBoundingClientRect().width / 2;
        const y = e.currentTarget.getBoundingClientRect().y + e.currentTarget.getBoundingClientRect().height / 2;
        location.replace(path.go(urlOf(hrefOrUrl, {
            x,
            y
        })));
    }, [
        hrefOrUrl,
        path
    ]);
    const onContextMenu = useCallback((e)=>{
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        location.replace(path.go(urlOf(hrefOrUrl, {
            x,
            y
        })));
    }, [
        hrefOrUrl,
        path
    ]);
    return {
        onClick,
        onKeyDown,
        onContextMenu,
        href
    };
}

export { HashPathProvider, HashSubpathProvider, PathContext, RootPathProvider, SearchSubpathProvider, useCoords, useHashSubpath, usePathContext, useSearchState, useSearchSubpath, useSearchValue };
//# sourceMappingURL=index.mjs.map
