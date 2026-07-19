/**
 * PremiumButton — Production-grade button with ripple effect and spring physics.
 *
 * Variants: primary (white), secondary (glass), ghost, destructive
 * Sizes: sm, md, lg
 * Features: ripple on click, spring press, loading spinner, icon support
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-white text-black hover:bg-white/90 shadow-[0_2px_8px_rgba(255,255,255,0.1)]',
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
    destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
};

const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5 rounded-xl',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-2xl',
    lg: 'px-7 py-3.5 text-sm gap-2.5 rounded-2xl',
};

const PremiumButton = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    className = '',
    onClick,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);

    const handleClick = useCallback((e) => {
        if (disabled || loading) return;

        // Create ripple
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        setRipples(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 600);

        onClick?.(e);
    }, [onClick, disabled, loading]);

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.03 } : undefined}
            whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`
                relative inline-flex items-center justify-center font-semibold
                overflow-hidden select-none
                transition-colors duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {/* Ripple effects */}
            <AnimatePresence>
                {ripples.map(({ id, x, y }) => (
                    <motion.span
                        key={id}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            left: x - 10,
                            top: y - 10,
                            width: 20,
                            height: 20,
                            background: variant === 'primary'
                                ? 'rgba(0,0,0,0.15)'
                                : 'rgba(255,255,255,0.2)',
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Content */}
            <span className="relative z-10 flex items-center gap-inherit">
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : Icon ? (
                    <Icon className="w-4 h-4" />
                ) : null}
                {children}
                {IconRight && !loading && <IconRight className="w-4 h-4" />}
            </span>
        </motion.button>
    );
};

export default React.memo(PremiumButton);
