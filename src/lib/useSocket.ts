"use client";

import { useEffect, useRef } from "react";
import { io as ioClient, Socket } from "socket.io-client";

interface UseSocketOptions {
  userId?: number | null;
  orgIds?: number[];
  isAdmin?: boolean;
}

let globalSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = ioClient({ path: "/api/socketio", transports: ["websocket", "polling"] });
  }
  return globalSocket;
}

export function useSocket(options: UseSocketOptions = {}): Socket | null {
  const { userId, orgIds, isAdmin } = options;
  const socketRef = useRef<Socket | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    refCount++;

    if (!joinedRef.current && (userId || isAdmin)) {
      socket.emit("join-rooms", { userId, orgIds: orgIds || [], isAdmin: !!isAdmin });
      joinedRef.current = true;
    }

    return () => {
      refCount--;
      if (refCount <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        refCount = 0;
      }
      joinedRef.current = false;
    };
  }, [userId, orgIds, isAdmin]);

  return socketRef.current;
}
