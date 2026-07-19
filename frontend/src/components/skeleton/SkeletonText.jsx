/**
 * SkeletonText — Simulates text lines with configurable widths.
 */
import React from 'react';
import SkeletonBase from './SkeletonBase';

const SkeletonText = ({
    lines = 3,
    widths = [],
    lineHeight = 'h-3',
    gap = 'gap-2.5',
    className = '',
}) => {
    const defaultWidths = ['w-full', 'w-[85%]', 'w-[70%]', 'w-[60%]', 'w-[50%]'];

    return (
        <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBase
                    key={i}
                    className={`${lineHeight} ${widths[i] || defaultWidths[i] || 'w-full'}`}
                    rounded="rounded-full"
                />
            ))}
        </div>
    );
};

export default React.memo(SkeletonText);
