export interface FileRef { name: string; size: number; kind: 'pdf' | 'image'; previewUrl: string }
export interface SessionPort { read(): string | undefined; write(token: string): void; clear(): void }
export interface TransportPort {
  request<T>(input: { url: string; method: 'GET' | 'POST'; token?: string; data?: unknown }): Promise<T>;
}
export interface BusinessEnvelope<T> { code: number; msg?: string; data: T }
