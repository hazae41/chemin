'use strict';

var React = require('react');
var option = require('@hazae41/option');
var reactCloseContext = require('@hazae41/react-close-context');
var index = require('../../libs/url/index.cjs');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const PathContext = /*#__PURE__*/ React.createContext(undefined);
function usePathContext() {
    return option.Option.wrap(React.useContext(PathContext));
}
/**
 * Root-based path provider using the modern Navigation API
 * @param props 
 * @returns 
 */ function RootPathProvider(props) {
    const { children } = props;
    const [raw, setRaw] = React.useState();
    React.useEffect(()=>{
        const onCurrentEntryChange = ()=>setRaw(location.href);
        navigation?.addEventListener("currententrychange", onCurrentEntryChange, {
            passive: true
        });
        return ()=>navigation?.removeEventListener("currententrychange", onCurrentEntryChange);
    }, []);
    const get = React.useCallback(()=>{
        return new URL(location.href);
    }, [
        raw
    ]);
    const url = React.useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = React.useCallback((hrefOrUrl)=>{
        return new URL(hrefOrUrl, location.href);
    }, []);
    const handle = React.useMemo(()=>{
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
    return /*#__PURE__*/ React__namespace.createElement(PathContext.Provider, {
        value: handle
    }, children);
}
/**
 * Hash-based subpath provider using the legacy `hashchange`
 * @param props 
 * @returns 
 */ function HashPathProvider(props) {
    const { children } = props;
    const [raw, setRaw] = React.useState();
    React.useEffect(()=>{
        const onHashChange = ()=>setRaw(location.href);
        addEventListener("hashchange", onHashChange, {
            passive: true
        });
        return ()=>removeEventListener("hashchange", onHashChange);
    }, []);
    const get = React.useCallback(()=>{
        return index.hashAsUrl(location.href);
    }, [
        raw
    ]);
    const url = React.useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = React.useCallback((hrefOrUrl)=>{
        const url = new URL(location.href);
        url.hash = `#${index.pathOf(hrefOrUrl)}`;
        return url;
    }, []);
    const handle = React.useMemo(()=>{
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
    return /*#__PURE__*/ React__namespace.createElement(PathContext.Provider, {
        value: handle
    }, children);
}
/**
 * Get a hash-based subpath from the given path
 * @param path 
 * @returns 
 */ function useHashSubpath(path) {
    const get = React.useCallback(()=>{
        return index.hashAsUrl(path.get());
    }, [
        path
    ]);
    const url = React.useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = React.useCallback((hrefOrUrl)=>{
        const url = path.get();
        url.hash = `#${index.pathOf(hrefOrUrl)}`;
        return path.go(url);
    }, [
        path
    ]);
    return React.useMemo(()=>{
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
    const onClose = React.useCallback(()=>{
        location.replace(hash.go("/"));
    }, [
        hash
    ]);
    return /*#__PURE__*/ React__namespace.createElement(PathContext.Provider, {
        value: hash
    }, /*#__PURE__*/ React__namespace.createElement(reactCloseContext.CloseContext.Provider, {
        value: onClose
    }, children));
}
/**
 * Get a search-based subpath from the given path
 * @param path 
 * @param key 
 * @returns 
 */ function useSearchSubpath(path, key) {
    const get = React.useCallback(()=>{
        return index.searchAsUrl(path.get(), key);
    }, [
        key,
        path
    ]);
    const url = React.useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const go = React.useCallback((hrefOrUrl)=>{
        const url = path.get();
        url.searchParams.set(key, index.pathOf(hrefOrUrl));
        return path.go(url);
    }, [
        key,
        path
    ]);
    return React.useMemo(()=>{
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
    const get = React.useCallback(()=>{
        return path.get().searchParams.get(key);
    }, [
        key,
        path
    ]);
    const value = React.useMemo(()=>{
        return get();
    }, [
        get
    ]);
    const set = React.useCallback((value)=>{
        const url = path.get();
        if (value == null) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
        return path.go(url);
    }, [
        key,
        path
    ]);
    return React.useMemo(()=>{
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
    const state = React.useMemo(()=>{
        return path.get().searchParams.get(key);
    }, [
        path,
        key
    ]);
    const setStateRef = React.useRef();
    setStateRef.current = React.useCallback((action)=>{
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
    const setState = React.useCallback((action)=>{
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
    const onClose = React.useCallback(()=>{
        location.replace(search.go("/"));
    }, [
        search
    ]);
    return /*#__PURE__*/ React__namespace.createElement(PathContext.Provider, {
        value: search
    }, /*#__PURE__*/ React__namespace.createElement(reactCloseContext.CloseContext.Provider, {
        value: onClose
    }, children));
}
/**
 * Pass the coordinates of the events to the given URL and replace-navigate to it relative to the given path
 * @param path 
 * @param hrefOrUrl 
 * @returns 
 */ function useCoords(path, hrefOrUrl) {
    const href = React.useMemo(()=>{
        if (hrefOrUrl == null) return;
        return path.go(hrefOrUrl).href;
    }, [
        hrefOrUrl,
        path
    ]);
    const onClick = React.useCallback((e)=>{
        if (e.button !== 0) return;
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        location.replace(path.go(index.urlOf(hrefOrUrl, {
            x,
            y
        })));
    }, [
        hrefOrUrl,
        path
    ]);
    const onKeyDown = React.useCallback((e)=>{
        if (e.key !== "Enter") return;
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.currentTarget.getBoundingClientRect().x + e.currentTarget.getBoundingClientRect().width / 2;
        const y = e.currentTarget.getBoundingClientRect().y + e.currentTarget.getBoundingClientRect().height / 2;
        location.replace(path.go(index.urlOf(hrefOrUrl, {
            x,
            y
        })));
    }, [
        hrefOrUrl,
        path
    ]);
    const onContextMenu = React.useCallback((e)=>{
        if (hrefOrUrl == null) return;
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        location.replace(path.go(index.urlOf(hrefOrUrl, {
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

exports.HashPathProvider = HashPathProvider;
exports.HashSubpathProvider = HashSubpathProvider;
exports.PathContext = PathContext;
exports.RootPathProvider = RootPathProvider;
exports.SearchSubpathProvider = SearchSubpathProvider;
exports.useCoords = useCoords;
exports.useHashSubpath = useHashSubpath;
exports.usePathContext = usePathContext;
exports.useSearchState = useSearchState;
exports.useSearchSubpath = useSearchSubpath;
exports.useSearchValue = useSearchValue;
//# sourceMappingURL=index.cjs.map
