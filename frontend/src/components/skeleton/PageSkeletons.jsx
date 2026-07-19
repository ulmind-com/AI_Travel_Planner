/**
 * Page-specific skeleton compositions.
 * Each skeleton EXACTLY mirrors the final UI layout to prevent CLS.
 */
import React from 'react';
import SkeletonBase from './SkeletonBase';
import SkeletonText from './SkeletonText';
import SkeletonAvatar from './SkeletonAvatar';
import SkeletonCard from './SkeletonCard';
import SkeletonButton from './SkeletonButton';

/* ─────────────────────────────────────────────
 * 1. COMMUNITY FEED — PostSkeleton
 * Mirrors: PostCard (avatar, username, image block, text, action row)
 * ───────────────────────────────────────────── */
export const PostSkeleton = React.memo(() => (
    <SkeletonCard className="space-y-5">
        {/* Author row */}
        <div className="flex items-center gap-4">
            <SkeletonAvatar size="w-12 h-12" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-4 w-32" rounded="rounded-full" />
                <SkeletonBase className="h-3 w-20" rounded="rounded-full" />
            </div>
            <SkeletonBase className="h-6 w-16" rounded="rounded-full" />
        </div>
        {/* Image block */}
        <SkeletonBase className="w-full h-52" rounded="rounded-2xl" />
        {/* Text lines */}
        <SkeletonText lines={2} widths={['w-full', 'w-3/4']} />
        {/* Action bar */}
        <div className="flex items-center gap-6 pt-2">
            <SkeletonBase className="h-5 w-14" rounded="rounded-full" />
            <SkeletonBase className="h-5 w-14" rounded="rounded-full" />
            <SkeletonBase className="h-5 w-14" rounded="rounded-full" />
        </div>
    </SkeletonCard>
));

/* ─────────────────────────────────────────────
 * 2. COMMUNITY FEED — StorySkeleton
 * Mirrors: StoryBar (horizontal scroll of circles)
 * ───────────────────────────────────────────── */
export const StorySkeleton = React.memo(() => (
    <div className="flex gap-4 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <SkeletonAvatar size="w-16 h-16" />
                <SkeletonBase className="h-2.5 w-12" rounded="rounded-full" />
            </div>
        ))}
    </div>
));

/* ─────────────────────────────────────────────
 * 3. COMMUNITY FEED — Full feed skeleton
 * Mirrors: SocialHubPage (search bar + tabs + stories + posts)
 * ───────────────────────────────────────────── */
export const CommunityFeedSkeleton = React.memo(() => (
    <div className="space-y-6" aria-hidden="true">
        <StorySkeleton />
        <PostSkeleton />
        <PostSkeleton />
    </div>
));

/* ─────────────────────────────────────────────
 * 4. PROFILE PAGE
 * Mirrors: ProfilePage (left sidebar + right tab content)
 * ───────────────────────────────────────────── */
export const ProfileHeaderSkeleton = React.memo(() => (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col items-center" aria-hidden="true">
        {/* Avatar */}
        <SkeletonAvatar size="w-32 h-32" className="mb-5" />
        {/* Name */}
        <SkeletonBase className="h-5 w-40 mb-2" rounded="rounded-full" />
        {/* Username */}
        <SkeletonBase className="h-3 w-24 mb-3" rounded="rounded-full" />
        {/* Bio */}
        <SkeletonBase className="h-3 w-56 mb-5" rounded="rounded-full" />
        {/* Badges */}
        <div className="flex gap-2 mb-6">
            <SkeletonBase className="h-6 w-20" rounded="rounded-full" />
            <SkeletonBase className="h-6 w-24" rounded="rounded-full" />
        </div>
        <hr className="w-full border-white/5 mb-6" />
        {/* Stats grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
            {[1, 2].map(i => (
                <div key={i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                    <SkeletonBase className="h-6 w-10 mx-auto mb-1.5" rounded="rounded-lg" />
                    <SkeletonBase className="h-2.5 w-16 mx-auto" rounded="rounded-full" />
                </div>
            ))}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3 col-span-2">
                <SkeletonBase className="h-6 w-10 mx-auto mb-1.5" rounded="rounded-lg" />
                <SkeletonBase className="h-2.5 w-24 mx-auto" rounded="rounded-full" />
            </div>
        </div>
        {/* Edit button */}
        <SkeletonButton width="w-full" height="h-12" />
    </div>
));

export const ProfilePostSkeleton = React.memo(() => (
    <div className="space-y-4" aria-hidden="true">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
                <SkeletonBase className="h-4 w-48" rounded="rounded-full" />
                <SkeletonText lines={2} widths={['w-full', 'w-[80%]']} />
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <SkeletonBase className="h-3 w-20" rounded="rounded-full" />
                    <div className="flex gap-4">
                        <SkeletonBase className="h-3 w-14" rounded="rounded-full" />
                        <SkeletonBase className="h-3 w-14" rounded="rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
));

export const ProfilePageSkeleton = React.memo(() => (
    <div className="min-h-screen bg-background pt-24 px-4 md:px-8" aria-hidden="true">
        <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
                <ProfileHeaderSkeleton />
                <div className="space-y-6">
                    {/* Tab selector */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-1.5 flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <SkeletonBase key={i} className="h-10 w-24" rounded="rounded-xl" />
                        ))}
                    </div>
                    <ProfilePostSkeleton />
                </div>
            </div>
        </div>
    </div>
));

/* ─────────────────────────────────────────────
 * 5. ADMIN DASHBOARD
 * Mirrors: Dashboard (header + metrics grid + chart panels + activity feed)
 * ───────────────────────────────────────────── */
export const StatCardSkeleton = React.memo(() => (
    <div className="bg-card/80 border border-white/10 rounded-2xl p-5 space-y-3" aria-hidden="true">
        <div className="flex items-center justify-between">
            <SkeletonBase className="h-4 w-24" rounded="rounded-full" />
            <SkeletonBase className="h-8 w-8" rounded="rounded-lg" />
        </div>
        <SkeletonBase className="h-8 w-20" rounded="rounded-lg" />
        <SkeletonBase className="h-2.5 w-32" rounded="rounded-full" />
    </div>
));

export const ChartSkeleton = React.memo(() => (
    <div className="bg-card/80 border border-white/10 rounded-3xl p-6 space-y-4" aria-hidden="true">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <SkeletonBase className="h-4 w-40" rounded="rounded-full" />
                <SkeletonBase className="h-2.5 w-28" rounded="rounded-full" />
            </div>
            <SkeletonBase className="h-6 w-16" rounded="rounded-full" />
        </div>
        {/* Chart area with bar approximation */}
        <div className="flex items-end gap-2 h-48 pt-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonBase
                    key={i}
                    className="flex-1"
                    rounded="rounded-t-lg"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                />
            ))}
        </div>
    </div>
));

export const AdminDashboardSkeleton = React.memo(() => (
    <div className="space-y-6 pb-20" aria-hidden="true">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div className="space-y-2">
                <SkeletonBase className="h-8 w-72" rounded="rounded-lg" />
                <SkeletonBase className="h-3 w-56" rounded="rounded-full" />
            </div>
            <div className="flex gap-3">
                <SkeletonButton width="w-48" height="h-9" />
                <SkeletonButton width="w-40" height="h-9" />
            </div>
        </div>
        {/* Metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <ChartSkeleton key={i} />)}
        </div>
    </div>
));

/* ─────────────────────────────────────────────
 * 6. ADMIN TABLE PAGES (Plans, Reviews, Audit, Users)
 * Mirrors: Table with header row + data rows
 * ───────────────────────────────────────────── */
export const TableRowSkeleton = React.memo(({ cols = 6 }) => (
    <tr aria-hidden="true">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <SkeletonBase
                    className={`h-4 ${i === 0 ? 'w-28' : i === cols - 1 ? 'w-10' : 'w-20'}`}
                    rounded="rounded-full"
                />
            </td>
        ))}
    </tr>
));

export const TableSkeleton = React.memo(({ rows = 8, cols = 6 }) => (
    <div className="bg-card/80 border border-white/10 rounded-3xl overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30" />
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/10">
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i} className="px-6 py-4">
                                <SkeletonBase className="h-3 w-20" rounded="rounded-full" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} cols={cols} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
));

export const AdminTablePageSkeleton = React.memo(({ cols = 6 }) => (
    <div className="space-y-6 pb-20" aria-hidden="true">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div className="space-y-2">
                <SkeletonBase className="h-8 w-56" rounded="rounded-lg" />
                <SkeletonBase className="h-3 w-44" rounded="rounded-full" />
            </div>
            <SkeletonButton width="w-36" height="h-9" />
        </div>
        {/* Filter bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
            </div>
            <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
        </div>
        {/* Table */}
        <TableSkeleton cols={cols} />
    </div>
));

/* ─────────────────────────────────────────────
 * 7. CHAT PAGE
 * Mirrors: ChatPage (sidebar list + message area)
 * ───────────────────────────────────────────── */
export const ChatSidebarSkeleton = React.memo(() => (
    <div className="space-y-2 px-4" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <SkeletonAvatar size="w-12 h-12" shape="rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-3.5 w-28" rounded="rounded-full" />
                    <SkeletonBase className="h-2.5 w-40" rounded="rounded-full" />
                </div>
                <SkeletonBase className="h-2.5 w-8" rounded="rounded-full" />
            </div>
        ))}
    </div>
));

export const MessageSkeleton = React.memo(() => (
    <div className="space-y-4 p-6" aria-hidden="true">
        {/* Incoming messages (left) */}
        <div className="flex justify-start">
            <div className="max-w-[65%] space-y-1">
                <SkeletonBase className="h-16 w-56" rounded="rounded-3xl rounded-tl-none" />
                <SkeletonBase className="h-2 w-14" rounded="rounded-full" />
            </div>
        </div>
        {/* Outgoing message (right) */}
        <div className="flex justify-end">
            <div className="max-w-[65%] space-y-1 flex flex-col items-end">
                <SkeletonBase className="h-12 w-48 !bg-emerald-500/10" rounded="rounded-3xl rounded-tr-none" />
                <SkeletonBase className="h-2 w-14" rounded="rounded-full" />
            </div>
        </div>
        {/* Incoming */}
        <div className="flex justify-start">
            <div className="max-w-[65%] space-y-1">
                <SkeletonBase className="h-20 w-64" rounded="rounded-3xl rounded-tl-none" />
                <SkeletonBase className="h-2 w-14" rounded="rounded-full" />
            </div>
        </div>
        {/* Outgoing */}
        <div className="flex justify-end">
            <div className="max-w-[65%] space-y-1 flex flex-col items-end">
                <SkeletonBase className="h-10 w-40 !bg-emerald-500/10" rounded="rounded-3xl rounded-tr-none" />
                <SkeletonBase className="h-2 w-14" rounded="rounded-full" />
            </div>
        </div>
    </div>
));

/* ─────────────────────────────────────────────
 * 8. SEARCH PAGE — Result cards
 * Mirrors: SearchPage (AI recommendation cards)
 * ───────────────────────────────────────────── */
export const ResultCardSkeleton = React.memo(() => (
    <SkeletonCard className="space-y-4">
        {/* Image */}
        <SkeletonBase className="w-full h-44" rounded="rounded-2xl" />
        {/* Title + match badge */}
        <div className="flex items-center justify-between">
            <SkeletonBase className="h-5 w-40" rounded="rounded-full" />
            <SkeletonBase className="h-6 w-20" rounded="rounded-full" />
        </div>
        {/* Description */}
        <SkeletonText lines={2} widths={['w-full', 'w-[75%]']} />
        {/* Stats row */}
        <div className="flex gap-3 pt-2">
            <SkeletonBase className="h-7 w-16" rounded="rounded-full" />
            <SkeletonBase className="h-7 w-20" rounded="rounded-full" />
            <SkeletonBase className="h-7 w-14" rounded="rounded-full" />
        </div>
    </SkeletonCard>
));

export const SearchPageSkeleton = React.memo(() => (
    <div className="space-y-6" aria-hidden="true">
        {/* Search form skeleton */}
        <SkeletonCard className="space-y-4">
            <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
            <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
                <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
                <SkeletonBase className="h-12 w-full" rounded="rounded-2xl" />
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                    <SkeletonBase key={i} className="h-10 w-12" rounded="rounded-full" />
                ))}
            </div>
            <SkeletonButton width="w-full" height="h-14" />
        </SkeletonCard>
        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <ResultCardSkeleton key={i} />)}
        </div>
    </div>
));
