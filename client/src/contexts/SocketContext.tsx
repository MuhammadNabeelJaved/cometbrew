/**
 * Socket Context
 *
 * Provides a single, authenticated Socket.IO connection for the entire app.
 * - Connection is created when the user is authenticated and destroyed on logout.
 * - The socket sends the HTTP-only cookie automatically (withCredentials: true).
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
    const { isAuthenticated, user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect when the user is authenticated
        if (!isAuthenticated || !user) {
            // Disconnect and clean up if the user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Avoid creating duplicate connections
        if (socketRef.current?.connected) return;

        const socket = io(SOCKET_URL, {
            withCredentials: true, // sends the HTTP-only accessToken cookie
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            // Don't disconnect on component unmount — keep the connection alive
            // across route changes. Only disconnect on logout (handled above).
        };
    }, [isAuthenticated, user?._id]);

    // Full cleanup on unmount of the provider itself (app teardown)
    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{ socket: socketRef.current, isConnected }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
