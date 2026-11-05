import type { BusinessEnvelope, SessionPort, TransportPort } from '../core/ports';
import { normalizeApiBase } from '../core/preview';
// No speculative business endpoints: consumers supply an existing contract path.
export function createApiClient(base: string, transport: TransportPort, session: SessionPort) {
  const apiBase = normalizeApiBase(base);
  return {
    async request<T>(path: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
      if (!apiBase) throw new Error('尚未配置 API 地址');
      if (!path.startsWith('/') || path.startsWith('//')) throw new Error('接口须使用相对业务路径');
      const result = await transport.request<BusinessEnvelope<T>>({ url: `${apiBase}${path}`, method, data, token: session.read() });
      if (result.code !== 200) throw new Error(result.msg || `业务请求失败（${result.code}）`);
      return result.data;
    },
  };
}
