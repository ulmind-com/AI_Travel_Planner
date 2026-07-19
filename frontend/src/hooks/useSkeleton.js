/**
 * useSkeleton — Delay-aware skeleton visibility controller.
 *
 * Prevents UI flickering by only showing skeletons if loading takes > 300ms.
 * Provides a smooth fade-out transition control flag.
 *
 * Usage:
 *   const { showSkeleton, contentReady } = useSkeleton(isLoading);
 *   if (showSkeleton) return <MySkeleton />;
 *   return <motion.div animate={{ opacity: contentReady ? 1 : 0 }}><RealContent /></motion.div>;
 */
import { useState, useEffect, useRef } from 'react';

const useSkeleton = (isLoading, delay = 300) => {
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [contentReady, setContentReady] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isLoading) {
            setContentReady(false);
            timerRef.current = setTimeout(() => {
                setShowSkeleton(true);
            }, delay);
        } else {
            // Loading finished
            clearTimeout(timerRef.current);
            setShowSkeleton(false);
            // Small delay for fade-in transition
            const fadeTimer = setTimeout(() => {
                setContentReady(true);
            }, 50);
            return () => clearTimeout(fadeTimer);
        }

        return () => clearTimeout(timerRef.current);
    }, [isLoading, delay]);

    return { showSkeleton, contentReady };
};

export default useSkeleton;
