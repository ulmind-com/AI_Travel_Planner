/**
 * SkeletonButton — Simulates pill/capsule action buttons.
 */
import React from 'react';
import SkeletonBase from './SkeletonBase';

const SkeletonButton = ({
    width = 'w-32',
    height = 'h-10',
    className = '',
}) => {
    return (
        <SkeletonBase
            className={`${width} ${height} ${className}`}
            rounded="rounded-full"
        />
    );
};

export default React.memo(SkeletonButton);
