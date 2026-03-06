interface RequestSession {
  step: "awaiting_service" | "awaiting_contact" | "awaiting_confirm";
  service?: string;
  phone?: string;
  email?: string;
}

const sessions = new Map<number, RequestSession>();
const linkSessions = new Set<number>();

export function getSession(userId: number) { return sessions.get(userId); }
export function setSession(userId: number, data: RequestSession) { sessions.set(userId, data); }
export function clearSession(userId: number) { sessions.delete(userId); }

export function setAwaitingLink(userId: number) { linkSessions.add(userId); }
export function isAwaitingLink(userId: number) { return linkSessions.has(userId); }
export function clearAwaitingLink(userId: number) { linkSessions.delete(userId); }
