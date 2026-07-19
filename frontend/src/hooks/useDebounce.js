/**
 * useDebounce — Debounces a value by the specified delay.
 * Perfect for search inputs, filter fields, and any rapid-change value.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 350);
 *   useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
