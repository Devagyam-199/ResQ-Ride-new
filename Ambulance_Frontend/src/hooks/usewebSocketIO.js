import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const useSocket = (token) => {
  const ref             = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth:       { token },
      transports: ["websocket"],
    });

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    ref.current = socket;

    return () => {
      socket.disconnect();
      ref.current = null;
      setConnected(false);
    };
  }, [token]);

  const emit = useCallback((event, data) => {
    ref.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    ref.current?.on(event, handler);
    return () => ref.current?.off(event, handler);
  }, []);

  return { socket: ref.current, connected, emit, on };
};

export default useSocket;