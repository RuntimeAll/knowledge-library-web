const SESSION_KEY = "knowledge-library:client-auth:v1";
export interface ClientIdentity {
  username: string;
  displayName: string;
}
interface StoredSession {
  token: string;
  identity: ClientIdentity;
}
export function readClientSession(): StoredSession | null {
  const value = uni.getStorageSync(SESSION_KEY) as
    | Partial<StoredSession>
    | undefined;
  return value && typeof value.token === "string" && value.identity?.username
    ? (value as StoredSession)
    : null;
}
export function saveClientSession(
  token: string,
  identity: ClientIdentity,
): void {
  uni.setStorageSync(SESSION_KEY, { token, identity });
}
export function clearClientSession(): void {
  uni.removeStorageSync(SESSION_KEY);
}
