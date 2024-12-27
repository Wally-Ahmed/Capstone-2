import useSearchParams from "./useSearchParams";
import { useCallback } from "react";


export default function useQueryString(key) {
    const [params, updateParams] = useSearchParams();
    const value = key ? params.get(key) : undefined;

    const setValue = useCallback(
        (newValue) => {
            if (!key) return;

            updateParams(params => {
                newValue != null ? params.set(key, newValue) : params.delete(key);
            });
        },
        [key, params],
    );

    return [value, setValue];
}