/**
 * Barrel export — Centralized skeleton system.
 * Import everything from '@/components/skeleton'
 */

// Core primitives
export { default as SkeletonBase } from './SkeletonBase';
export { default as SkeletonText } from './SkeletonText';
export { default as SkeletonAvatar } from './SkeletonAvatar';
export { default as SkeletonCard } from './SkeletonCard';
export { default as SkeletonButton } from './SkeletonButton';
export { default as SkeletonGrid } from './SkeletonGrid';

// Page-specific compositions
export {
    // Community
    PostSkeleton,
    StorySkeleton,
    CommunityFeedSkeleton,
    // Profile
    ProfileHeaderSkeleton,
    ProfilePostSkeleton,
    ProfilePageSkeleton,
    // Admin Dashboard
    StatCardSkeleton,
    ChartSkeleton,
    AdminDashboardSkeleton,
    // Admin Tables (Plans / Reviews / Audit / Users)
    TableRowSkeleton,
    TableSkeleton,
    AdminTablePageSkeleton,
    // Chat
    ChatSidebarSkeleton,
    MessageSkeleton,
    // Search
    ResultCardSkeleton,
    SearchPageSkeleton,
} from './PageSkeletons';
