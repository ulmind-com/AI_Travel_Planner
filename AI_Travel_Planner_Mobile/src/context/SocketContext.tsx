/**
 * SocketContext — real-time transport for the mobile app.
 *
 * Mirrors the website's appContext socket layer:
 *  - Connects to the backend with socket.io (websocket + polling)
 *  - Emits `identity` with the Firebase UID so the server can track presence
 *  - Tracks the set of online user IDs (user:online / user:offline / online-users-list)
 *  - Auto reconnects and re-identifies
 *
 * Consumers use `useSocket()` for the raw socket (chat:message etc.) and
 * `onlineUserIds` for presence dots.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../lib/env';

interface SocketContextValue {
  socket: Socket | null;
  onlineUserIds: Set<string>;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!uid) {
      // Signed out — tear down any existing socket.
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUserIds(new Set());
        setIsConnected(false);
      }
      return;
    }

    // Already connected for this user.
    if (socketRef.current) return;

    const newSocket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const identify = () => {
      newSocket.emit('identity', uid);
      newSocket.emit('get-online-users');
    };

    newSocket.on('connect', () => {
      setIsConnected(true);
      identify();
    });

    newSocket.on('reconnect', () => {
      setIsConnected(true);
      identify();
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('online-users-list', (userIds: string[]) => {
      setOnlineUserIds(new Set(userIds));
    });

    newSocket.on('user:online', (userId: string) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    newSocket.on('user:offline', (userId: string) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      newSocket.off('online-users-list');
      newSocket.off('user:online');
      newSocket.off('user:offline');
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [uid]);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, onlineUserIds, isConnected }),
    [socket, onlineUserIds, isConnected],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}
