/**
 * useParallax — Mouse-based 3D parallax effect.
 * Tracks mouse position and computes tilt/offset values for depth illusion.
 *
 * Usage:
 *   const { ref, style } = useParallax({ intensity: 15 });
 *   <div ref={ref} style={style}>Content</div>
 */
import { useRef, useState, useCallback, useEffect } from 'react';

const useParallax = ({ intensity = 10, perspective = 1000 } = {}) => {
    const ref = useRef(null);
    const [transform, setTransform] = useState({
        rotateX: 0,
        rotateY: 0,
        translateX: 0,
        translateY: 0,
    });
    const rafRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!ref.current) return;

        // Cancel pending frame to avoid jank
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const rect = ref.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            setTransform({
                rotateX: (y - 0.5) * -intensity,
                rotateY: (x - 0.5) * intensity,
                translateX: (x - 0.5) * intensity * 0.5,
                translateY: (y - 0.5) * intensity * 0.5,
            });
        });
    }, [intensity]);

    const handleMouseLeave = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setTransform({ rotateX: 0, rotateY: 0, translateX: 0, translateY: 0 });
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const style = {
        transform: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translate(${transform.translateX}px, ${transform.translateY}px)`,
        transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
    };

    return {
        ref,
        style,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
    };
};

export default useParallax;
