"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const latestOptionsRef = useRef<UseSocketOptions>({});

  // Keep latest options in a ref so reconnect handlers always see fresh rooms
  latestOptionsRef.current = { userId, orgIds, isAdmin };

  // Stabilize orgIds so the effect doesn't re-run on every render
  const orgIdsKey = orgIds?.slice().sort().join(",") ?? "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableOrgIds = useMemo(() => orgIds, [orgIdsKey]);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket((prev) => (prev === socketInstance ? prev : socketInstance));
    refCount++;

    const doJoin = () => {
      const { userId: latestUserId, orgIds: latestOrgIds, isAdmin: latestIsAdmin } = latestOptionsRef.current;
      const hasRooms =
        latestUserId ||
        (latestOrgIds && latestOrgIds.length > 0) ||
        latestIsAdmin;

      if (hasRooms) {
        socketInstance.emit("join-rooms", {
          userId: latestUserId,
          orgIds: latestOrgIds || [],
          isAdmin: !!latestIsAdmin,
        });
      }
    };

    if (socketInstance.connected) {
      doJoin();
    } else {
      socketInstance.once("connect", doJoin);
    }

    // Re-join rooms on reconnect (e.g. after temporary disconnect)
    socketInstance.on("connect", doJoin);

    return () => {
      socketInstance.off("connect", doJoin);
      refCount--;
      if (refCount <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        refCount = 0;
      }
    };
  }, [userId, stableOrgIds, isAdmin]);

  return socket;
}
