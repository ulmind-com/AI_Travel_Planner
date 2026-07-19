/**
 * SkeletonGrid — Renders a configurable grid of skeleton cards.
 * Useful for search results, liked posts, group lists, etc.
 */
import React from 'react';
import SkeletonCard from './SkeletonCard';
import SkeletonBase from './SkeletonBase';
import SkeletonText from './SkeletonText';

const SkeletonGrid = ({
    count = 4,
    cols = 'grid-cols-1 md:grid-cols-2',
    gap = 'gap-4',
    cardHeight = '200px',
    showImage = false,
    className = '',
}) => {
    return (
        <div className={`grid ${cols} ${gap} ${className}`} aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} height={cardHeight}>
                    {showImage && (
                        <SkeletonBase className="w-full h-32 mb-4" rounded="rounded-2xl" />
                    )}
                    <SkeletonText lines={2} widths={['w-[60%]', 'w-full']} />
                    <div className="flex items-center justify-between mt-4">
                        <SkeletonBase className="w-20 h-5" rounded="rounded-full" />
                        <SkeletonBase className="w-12 h-5" rounded="rounded-full" />
                    </div>
                </SkeletonCard>
            ))}
        </div>
    );
};

export default React.memo(SkeletonGrid);
