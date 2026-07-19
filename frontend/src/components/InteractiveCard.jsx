/**
 * InteractiveCard — Apple-level micro-interaction card wrapper.
 * Provides: hover scale, press feedback, optional glow border, and parallax tilt.
 *
 * Usage:
 *   <InteractiveCard>
 *     <h3>Title</h3>
 *     <p>Content</p>
 *   </InteractiveCard>
 */
import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

const InteractiveCard = ({
    children,
    className = '',
    as = 'div',
    hoverScale = 1.02,
    tapScale = 0.98,
    tilt = true,
    tiltIntensity = 8,
    glowOnHover = true,
    onClick,
    ...props
}) => {
    const cardRef = useRef(null);
    const [tiltStyle, setTiltStyle] = useState({});
    const [glowPosition, setGlowPosition] = useState({ x: '50%', y: '50%' });
    const rafRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current || !tilt) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            setTiltStyle({
                rotateX: (y - 0.5) * -tiltIntensity,
                rotateY: (x - 0.5) * tiltIntensity,
            });

            if (glowOnHover) {
                setGlowPosition({
                    x: `${x * 100}%`,
                    y: `${y * 100}%`,
                });
            }
        });
    }, [tilt, tiltIntensity, glowOnHover]);

    const handleMouseLeave = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setTiltStyle({ rotateX: 0, rotateY: 0 });
    }, []);

    const MotionComponent = motion[as] || motion.div;

    return (
        <MotionComponent
            ref={cardRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                ...(glowOnHover ? {
                    '--mouse-x': glowPosition.x,
                    '--mouse-y': glowPosition.y,
                } : {}),
            }}
            animate={{
                rotateX: tiltStyle.rotateX || 0,
                rotateY: tiltStyle.rotateY || 0,
            }}
            whileHover={{ scale: hoverScale }}
            whileTap={onClick ? { scale: tapScale } : undefined}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                mass: 0.8,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            {...props}
        >
            {/* Glow follow effect */}
            {glowOnHover && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06), transparent 40%)`,
                    }}
                    aria-hidden="true"
                />
            )}
            {children}
        </MotionComponent>
    );
};

export default React.memo(InteractiveCard);
