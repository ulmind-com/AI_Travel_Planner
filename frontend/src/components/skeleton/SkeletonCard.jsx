/**
 * SkeletonCard — Simulates glassmorphic card containers matching the app's design.
 * Matches: bg-card/40, border-white/5, rounded-[2rem].
 */
import React from 'react';

const SkeletonCard = ({
    children,
    className = '',
    height,
    padding = 'p-6',
}) => {
    return (
        <div
            className={`bg-white/[0.02] border border-white/5 rounded-[2rem] ${padding} ${className}`}
            style={{ minHeight: height }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

export default React.memo(SkeletonCard);
