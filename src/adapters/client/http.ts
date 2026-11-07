import { clearClientSession, readClientSession } from "./session";
import { normalizeApiBase } from "../../core/preview";
export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly uncertain = false,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}
export function clientApiBase(): string {
  const configured = normalizeApiBase(import.meta.env?.VITE_API_BASE_URL || "");
  if (configured) return configured;
  // #ifdef H5
  return "/api";
  // #endif
  // #ifndef H5
  throw new ClientApiError(
    "请配置当前平台的知识库 API 地址",
    "API_NOT_CONFIGURED",
  );
  // #endif
}
export interface Envelope<T> {
  code: number;
  msg?: string;
  data?: T;
  token?: string;
}
export function unwrap<T>(body: Envelope<T>): T {
  if (body.code !== 200) {
    throw new ClientApiError(
      body.msg || "请求未完成",
      String(body.code),
      body.code >= 500,
    );
  }
  return body.data as T;
}
export async function requestEnvelope<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  data?: unknown,
  authenticated = true,
): Promise<Envelope<T>> {
  const token = authenticated ? readClientSession()?.token : undefined;
  if (authenticated && !token) throw new ClientApiError("请先登录", "401");
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${clientApiBase()}${path}`,
      method,
      data: data as UniApp.RequestOptions["data"],
      timeout: 20000,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (response) => {
        if (
          (response.statusCode === 401 ||
            (response.data as { code?: number })?.code === 401) &&
          token &&
          token === readClientSession()?.token
        )
          clearClientSession();
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const body = response.data as { msg?: string };
          reject(
            new ClientApiError(
              body?.msg || `请求失败（${response.statusCode}）`,
              String(response.statusCode),
              response.statusCode >= 500,
            ),
          );
        } else resolve(response.data as Envelope<T>);
      },
      fail: () =>
        reject(
          new ClientApiError(
            "连接未完成，请查回本次提交后再操作",
            "NETWORK_UNKNOWN",
            method === "POST",
          ),
        ),
    });
  });
}
export async function requestData<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  data?: unknown,
): Promise<T> {
  return unwrap(await requestEnvelope<T>(path, method, data));
}
