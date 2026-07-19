import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger';
import os from 'os';

let io: Server;

// Map <UserId, Set<SocketId>>
const onlineUsers = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer): Server => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Periodic system metrics broadcast (Phase 4 Grafana Real-Time Observability)
    setInterval(() => {
        try {
            if (io) {
                const cpuUsage = os.loadavg();
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const memPercent = parseFloat(((usedMem / totalMem) * 100).toFixed(2));
                
                io.emit('system:metrics:update', {
                    cpuLoad: cpuUsage[0],
                    memory: {
                        total: totalMem,
                        free: freeMem,
                        used: usedMem,
                        percentage: memPercent
                    },
                    uptime: os.uptime()
                });
            }
        } catch (err) {
            // Fail-safe to prevent crash
        }
    }, 5000);

    // Periodic Travel Intelligence updates (every 5 minutes / 300,000 ms)
    setInterval(async () => {
        try {
            if (io) {
                const rooms = Array.from(io.sockets.adapter.rooms.keys());
                const activeLocations = rooms
                    .filter(r => r.startsWith('travel:intel:'))
                    .map(r => r.replace('travel:intel:', ''));

                if (activeLocations.length > 0) {
                    const { getTravelIntelligence } = await import('../../modules/travelIntel/travelIntelService');
                    for (const loc of activeLocations) {
                        try {
                            const updatedData = await getTravelIntelligence(loc);
                            io.to(`travel:intel:${loc}`).emit('travel:intel:update', {
                                weather: {
                                    temp: updatedData.weather.temp,
                                    rain: updatedData.weather.rain,
                                    wind: updatedData.weather.wind,
                                    uv: updatedData.weather.uv,
                                    humidity: updatedData.weather.humidity,
                                    description: updatedData.weather.description
                                },
                                crowdLevel: updatedData.crowd.level,
                                bestTimeToday: updatedData.bestTime.timeWindow,
                                riskLevel: updatedData.risk.level,
                                recommendations: updatedData.recommendations,
                                coordinates: updatedData.coordinates,
                                crowdDetails: updatedData.crowd,
                                riskDetails: {
                                    level: updatedData.risk.level,
                                    reasons: updatedData.risk.reasons,
                                    alerts: updatedData.risk.alerts
                                },
                                bestTimeDetails: updatedData.bestTime,
                                delayed: updatedData.delayed,
                                cached: updatedData.cached
                            });
                        } catch (err) {
                            logger.error(`[Socket Travel Intel Update] Failed for location: ${loc}`, err);
                        }
                    }
                }
            }
        } catch (err) {
            // Fail-safe
        }
    }, 300000);

    io.on('connection', (socket) => {

        socket.on('identity', (userId: string) => {
            if (!userId) return;

            // Add to map
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
                // First connection for this user -> Notify Admins they are online
                io.emit('user:online', userId);
            }
            onlineUsers.get(userId)?.add(socket.id);

            // Attach userId to socket for disconnect handling
            (socket as any).userId = userId;

            // logger.info(`User identified: ${userId}`);
        });

        socket.on('get-online-users', () => {
            // Send list of online User IDs
            const onlineIds = Array.from(onlineUsers.keys());
            socket.emit('online-users-list', onlineIds);
        });

        socket.on('group:join', (groupId: string) => {
            if (!groupId) return;
            socket.join(`group:${groupId}`);
        });

        socket.on('group:leave', (groupId: string) => {
            if (!groupId) return;
            socket.leave(`group:${groupId}`);
        });

        // Real-time Context-Aware AI Travel Chat Integration
        socket.on('chat:send', async (data: { message: string }) => {
            try {
                const firebaseUid = (socket as any).userId;
                if (!firebaseUid) {
                    socket.emit('chat:error', { message: 'User identity not established.' });
                    return;
                }

                // Dynamically import processUserMessage to avoid circular dependencies
                const { processUserMessage } = await import('../../modules/aiChat/chatService');
                const response = await processUserMessage(firebaseUid, data.message);

                // Push AI response back to the client
                socket.emit('chat:receive', response);
            } catch (err: any) {
                console.error('[Socket.io AI Chat Error]:', err);
                socket.emit('chat:error', { message: err.message || 'An error occurred during chat processing.' });
            }
        });

        // Real-time Travel Intelligence Subscriptions
        socket.on('travel:intel:subscribe', async (location: string) => {
            if (!location || typeof location !== 'string' || location.trim() === '') return;
            const roomName = `travel:intel:${location.trim().toLowerCase()}`;
            socket.join(roomName);

            try {
                const { getTravelIntelligence } = await import('../../modules/travelIntel/travelIntelService');
                const initialData = await getTravelIntelligence(location);
                socket.emit('travel:intel:update', {
                    weather: {
                        temp: initialData.weather.temp,
                        rain: initialData.weather.rain,
                        wind: initialData.weather.wind,
                        uv: initialData.weather.uv,
                        humidity: initialData.weather.humidity,
                        description: initialData.weather.description
                    },
                    crowdLevel: initialData.crowd.level,
                    bestTimeToday: initialData.bestTime.timeWindow,
                    riskLevel: initialData.risk.level,
                    recommendations: initialData.recommendations,
                    coordinates: initialData.coordinates,
                    crowdDetails: initialData.crowd,
                    riskDetails: {
                        level: initialData.risk.level,
                        reasons: initialData.risk.reasons,
                        alerts: initialData.risk.alerts
                    },
                    bestTimeDetails: initialData.bestTime,
                    delayed: initialData.delayed,
                    cached: initialData.cached
                });
            } catch (err) {
                socket.emit('travel:intel:error', { message: 'Failed to fetch travel intelligence.' });
            }
        });

        socket.on('travel:intel:unsubscribe', (location: string) => {
            if (!location) return;
            const roomName = `travel:intel:${location.trim().toLowerCase()}`;
            socket.leave(roomName);
        });

        socket.on('disconnect', () => {
            const userId = (socket as any).userId;
            if (userId && onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);
                userSockets?.delete(socket.id);

                if (userSockets?.size === 0) {
                    onlineUsers.delete(userId);
                    // Last connection dropped -> Notify Admins they are online
                    io.emit('user:offline', userId);
                }
            }
            // logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

/**
 * Helper to broadcast an event to everyone connected.
 */
export const broadcastRealtimeEvent = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
    }
};

/**
 * Helper to emit a notification to a specific user if they are online.
 */
export const sendRealtimeNotification = (recipientFirebaseUid: string, notification: any) => {
    if (io && onlineUsers.has(recipientFirebaseUid)) {
        onlineUsers.get(recipientFirebaseUid)?.forEach(socketId => {
            io.to(socketId).emit('notification', notification);
            io.to(socketId).emit('notification:new', notification);
        });
    }
};

/**
 * Helper to emit a message to a specific user if they are online.
 */
export const sendRealtimeMessage = (recipientFirebaseUid: string, message: any) => {
    if (io && onlineUsers.has(recipientFirebaseUid)) {
        onlineUsers.get(recipientFirebaseUid)?.forEach(socketId => {
            io.to(socketId).emit('message:direct', message);
        });
    }
};

/**
 * Helper to emit a message to a specific user if they are online.
 */
export const sendChatRealtimeMessage = (recipientFirebaseUid: string, data: any) => {
    if (io && onlineUsers.has(recipientFirebaseUid)) {
        onlineUsers.get(recipientFirebaseUid)?.forEach(socketId => {
            io.to(socketId).emit('chat:message', data);
        });
    }
};

/**
 * Helper to emit a message to a group room.
 */
export const sendRealtimeGroupMessage = (groupId: string, message: any) => {
    if (io) {
        io.to(`group:${groupId}`).emit('group:message', message);
    }
};

export const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
};

export const getOnlineUsersCount = (): number => {
    return onlineUsers.size;
};
