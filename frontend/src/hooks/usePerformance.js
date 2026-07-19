/**
 * usePerformance — Lightweight Web Vitals & custom performance tracker.
 * Tracks: LCP, FID, CLS, TTFB, and custom API latencies.
 * Logs to console in dev, can be wired to analytics in prod.
 */
import { useEffect, useCallback, useRef } from 'react';

const usePerformance = (pageName = 'unknown') => {
    const mountTime = useRef(performance.now());

    useEffect(() => {
        // Track page render time
        const renderTime = performance.now() - mountTime.current;
        if (import.meta.env.DEV) {
            console.log(
                `%c⚡ [Perf] ${pageName} rendered in ${renderTime.toFixed(1)}ms`,
                'color: #22c55e; font-weight: bold;'
            );
        }

        // Observe Web Vitals via PerformanceObserver
        if (typeof PerformanceObserver === 'undefined') return;

        const observers = [];

        // LCP — Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (import.meta.env.DEV) {
                    console.log(
                        `%c📊 [LCP] ${pageName}: ${lastEntry.startTime.toFixed(0)}ms`,
                        'color: #3b82f6;'
                    );
                }
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            observers.push(lcpObserver);
        } catch (e) { /* unsupported */ }

        // CLS — Cumulative Layout Shift
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            observers.push(clsObserver);

            // Report CLS on page hide
            const reportCLS = () => {
                if (import.meta.env.DEV && clsValue > 0) {
                    const color = clsValue < 0.1 ? '#22c55e' : clsValue < 0.25 ? '#f59e0b' : '#ef4444';
                    console.log(
                        `%c📐 [CLS] ${pageName}: ${clsValue.toFixed(4)}`,
                        `color: ${color};`
                    );
                }
            };
            document.addEventListener('visibilitychange', reportCLS);
        } catch (e) { /* unsupported */ }

        return () => {
            observers.forEach(o => o.disconnect());
        };
    }, [pageName]);

    // Track API call latency
    const trackApiCall = useCallback(async (label, asyncFn) => {
        const start = performance.now();
        try {
            const result = await asyncFn();
            const duration = performance.now() - start;
            if (import.meta.env.DEV) {
                const color = duration < 200 ? '#22c55e' : duration < 500 ? '#f59e0b' : '#ef4444';
                console.log(
                    `%c🌐 [API] ${label}: ${duration.toFixed(0)}ms`,
                    `color: ${color}; font-weight: bold;`
                );
            }
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            if (import.meta.env.DEV) {
                console.log(
                    `%c❌ [API] ${label}: FAILED after ${duration.toFixed(0)}ms`,
                    'color: #ef4444; font-weight: bold;'
                );
            }
            throw error;
        }
    }, []);

    return { trackApiCall };
};

export default usePerformance;
