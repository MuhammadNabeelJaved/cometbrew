/**
 * Socket Context
 *
 * Provides a single, authenticated Socket.IO connection for the entire app.
 * - Connection is created when the user is authenticated and destroyed on logout.
 * - Auth uses two layers: HTTP-only cookie (withCredentials) AND an in-memory
 *   access token passed via socket.handshake.auth.token. The token fallback is
 *   required because cross-domain HTTP-only cookies are blocked by some browsers
 *   even with SameSite=None (Safari ITP, Firefox ETP, Chrome Privacy Sandbox).
 * - All socket event listeners should be added via the `socket` object from useSocket().
 *
 * Usage:
 *   const { socket, isConnected } = useSocket();
 */
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    isConnected: false,
});

// In dev, socket.io goes through the Vite proxy (/socket.io -> :8000) so that
// HTTP-only cookies (set on localhost:5173) are sent correctly.
// In production, set VITE_SOCKET_URL to your backend URL.
const SOCKET_URL =
    (import.meta.env.VITE_SOCKET_URL as string) || window.location.origin;

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: isAuthLoading, user, socketToken } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Wait for auth to finish initialising before touching sockets.
        if (isAuthLoading) return;

        // Only connect when the user is authenticated
        if (!isAuthenticated || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Don't create a duplicate connection if already connected
        if (socketRef.current?.connected) return;

        // Clean up a stale disconnected socket before creating a new one
        if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socket = io(SOCKET_URL, {
            withCredentials: true,             // HTTP-only cookie (primary)
            auth: socketToken ? { token: socketToken } : {},  // in-memory token (fallback)
            transports: ['polling', 'websocket'],
            timeout: 60000,          // Give Render 60s to wake from cold start
            reconnectionDelay: 3000,
            reconnectionDelayMax: 15000,
            reconnectionAttempts: Infinity,
        });

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            setIsConnected(false);
            // Do NOT disable reconnection here — Render free tier can take 30-60s
            // to wake from sleep; the socket must keep retrying until it's up.
            // AuthContext handles true session expiry (logs user out), which
            // triggers the cleanup branch above on the next effect run.
            console.warn('[Socket] connect_error:', err.message);
        });

        // Bridge server-emitted data:updated events (sent to authenticated rooms
        // like admin:global, team:global, user:{id}) to the window CustomEvent
        // system so all useDataRealtime hooks fire automatically without needing
        // to know anything about sockets.
        socket.on('data:updated', (payload: { section: string }) => {
            window.dispatchEvent(
                new CustomEvent('cms:updated', { detail: { section: payload.section } })
            );
        });

        socketRef.current = socket;

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('data:updated');
            // Don't disconnect on component unmount — keep the connection alive
            // across route changes. Only disconnect on logout (handled above).
        };
    }, [isAuthenticated, isAuthLoading, user?._id, socketToken]);

    // Full cleanup on unmount of the provider itself (app teardown)
    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{ socket: isConnected ? socketRef.current : null, isConnected }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
