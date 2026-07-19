import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/AdminSocketContext';
import api from '../services/adminApi';

export interface ObservabilityMetrics {
    // User Metrics
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    userGrowthRate: number;

    // Content Metrics
    totalPosts: number;
    postsToday: number;
    commentsToday: number;
    likesToday: number;

    // Engagement Metrics
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    activeSessions: number;

    // System Metrics
    apiRequestCount: number;
    avgLatency: number;
    errorRate: number;

    // Fallbacks for legacy compatibility
    commentsCount: number;
    likesCount: number;
    groupJoins: number;
    onlineUsersCount: number;
}

export interface TimeSeriesData {
    hourlyRegistrations: { hour: string; registrations: number }[];
    dailyPosts: { date: string; count: number }[];
    dailyExperiences: { date: string; count: number }[];
    dailyComments: { date: string; count: number }[];
    dailyLikes: { date: string; count: number }[];
    dailyGroups: { date: string; count: number }[];
    apiLatency: { date: string; value: number }[];
    userGrowthTrend: { date: string; count: number }[];
    contentDistribution: { name: string; value: number; color: string }[];
}

export interface SystemHealthMetrics {
    cpuLoad: number;
    memory: {
        total: number;
        free: number;
        used: number;
        percentage: number;
    };
    uptime: number;
}

export const useAdminMetrics = () => {
    const { socket } = useSocket();
    const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);
    const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const [metricsRes, timeSeriesRes, healthRes] = await Promise.all([
                api.get('/metrics'),
                api.get('/timeseries'),
                api.get('/health')
            ]);

            if (metricsRes.data.success) {
                setMetrics(metricsRes.data.data);
            }
            if (timeSeriesRes.data.success) {
                setTimeSeries(timeSeriesRes.data.data);
            }
            if (healthRes.data.status === 'Success') {
                setSystemHealth(healthRes.data.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch dashboard metrics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllMetrics();
    }, [fetchAllMetrics]);

    // Live Socket listener for dynamic incremental updates & CPU/Memory streams
    useEffect(() => {
        if (!socket) return;

        // 1. Stream live CPU & RAM metrics from background ticker
        socket.on('system:metrics:update', (data: SystemHealthMetrics) => {
            setSystemHealth(data);
        });

        // 2. Stream online operators connectivity
        socket.on('user:online', () => {
            setMetrics((prev) => {
                if (!prev) return null;
                return { ...prev, onlineUsersCount: prev.onlineUsersCount + 1 };
            });
        });

        socket.on('user:offline', () => {
            setMetrics((prev) => {
                if (!prev) return null;
                return { ...prev, onlineUsersCount: Math.max(0, prev.onlineUsersCount - 1) };
            });
        });

        // 3. Stream activity logs to dynamically update Metrics Cards (Datadog Style)
        socket.on('activity:new', (activity: { activityType: string }) => {
            setMetrics((prev) => {
                if (!prev) return null;
                const updated = { ...prev };
                
                if (activity.activityType === 'user_created') {
                    updated.totalUsers += 1;
                    updated.activeUsers += 1;
                } else if (activity.activityType === 'create_experience_post') {
                    updated.postsCreatedToday += 1;
                } else if (activity.activityType === 'comment_added') {
                    updated.commentsCount += 1;
                } else if (activity.activityType === 'like:added') {
                    updated.likesCount += 1;
                } else if (activity.activityType === 'group:joined') {
                    updated.groupJoins += 1;
                }
                return updated;
            });
        });

        return () => {
            socket.off('system:metrics:update');
            socket.off('user:online');
            socket.off('user:offline');
            socket.off('activity:new');
        };
    }, [socket]);

    return {
        metrics,
        timeSeries,
        systemHealth,
        loading,
        error,
        refresh: fetchAllMetrics
    };
};
