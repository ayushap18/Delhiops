import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribe: (rooms: string[]) => void;
  unsubscribe: (rooms: string[]) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [token]);

  const subscribe = useCallback((rooms: string[]) => {
    const s = getSocket();
    if (s?.connected) {
      s.emit("subscribe", { rooms });
    }
  }, []);

  const unsubscribe = useCallback((rooms: string[]) => {
    const s = getSocket();
    if (s?.connected) {
      s.emit("unsubscribe", { rooms });
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, subscribe, unsubscribe }}>
      {children}
    </SocketContext.Provider>
  );
}
