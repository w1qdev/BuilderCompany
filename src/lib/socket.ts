import type { Server } from "socket.io";

export function getIO(): Server | null {
  return (globalThis as Record<string, unknown>).io as Server | null ?? null;
}
