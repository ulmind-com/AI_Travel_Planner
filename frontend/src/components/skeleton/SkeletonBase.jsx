/**
 * SkeletonBase — Core shimmer primitive.
 * All skeleton components in the system derive from this.
 * Matches the AdventureNexus dark theme: #000 bg, #0A0A0A cards, subtle white borders.
 */
import React from 'react';

const SkeletonBase = ({
    className = '',
    width,
    height,
    rounded = 'rounded-xl',
    style = {},
}) => {
    return (
        <div
            className={`skeleton-shimmer ${rounded} ${className}`}
            style={{
                width,
                height,
                ...style,
            }}
            aria-hidden="true"
        />
    );
};

export default React.memo(SkeletonBase);
