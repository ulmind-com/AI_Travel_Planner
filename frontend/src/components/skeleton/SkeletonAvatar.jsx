/**
 * SkeletonAvatar — Simulates circular or rounded avatar placeholders.
 */
import React from 'react';
import SkeletonBase from './SkeletonBase';

const SkeletonAvatar = ({
    size = 'w-12 h-12',
    shape = 'rounded-full',
    className = '',
}) => {
    return (
        <SkeletonBase
            className={`${size} shrink-0 ${className}`}
            rounded={shape}
        />
    );
};

export default React.memo(SkeletonAvatar);
