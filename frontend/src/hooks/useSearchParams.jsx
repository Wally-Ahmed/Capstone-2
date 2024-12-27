"use client";
import { ReadonlyURLSearchParams, useSearchParams as useNextSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";

export const QueryStringContext = createContext < QueryStringOverridesContext | null > (null);

export function QueryStringOverridesProvider({ children }) {
    const params = useNextSearchParams();
    const value = useState < ReadonlyURLSearchParams > (params);

    useLayoutEffect(() => value[1](params), [params]);

    return <QueryStringContext.Provider value={value}>{children}</QueryStringContext.Provider>;
}

// Using Next's router creates a new page request on every change,
// while using just window.history prevents useSearchParams from updating.
// This solution basically breaks useSearchParams, but still allows this
// specific hook to work properly, by using its own context.

// Related discussion: https://github.com/vercel/next.js/discussions/47583

export default function useSearchParams() {
    const params = useNextSearchParams();
    const overrides = useContext(QueryStringContext);

    const value = overrides ? overrides[0] : params;

    const updateValue = useCallback(
        (update) => {
            // if (!overrides) throw new Error("QueryStringOverridesProvider is required to silently mutate search params!");
            const newParams = new URLSearchParams(Array.from(value.entries()));
            update(newParams);

            const paramsStr = newParams.toString();
            const newUrl = location.origin + location.pathname + (paramsStr ? "?" + paramsStr : "");
            window.history.replaceState(window.history.state, "", newUrl);

            // overrides[1](new ReadonlyURLSearchParams(newParams));
        },
        [value, overrides],
    );

    return [value, updateValue];
}