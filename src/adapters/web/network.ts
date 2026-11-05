import type { TransportPort } from '../../core/ports';
export const network: TransportPort = {
  request<T>({ url, method, token, data }: Parameters<TransportPort['request']>[0]): Promise<T> {
    return new Promise((resolve, reject) => {
      uni.request({
        url, method, data: data as UniApp.RequestOptions['data'], timeout: 10000,
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (response) => {
          if (response.statusCode < 200 || response.statusCode >= 300) reject(new Error(`网络请求失败（${response.statusCode}）`));
          else resolve(response.data as T);
        },
        fail: () => reject(new Error('请求未完成，请核对连接后查询结果')),
      });
    });
  },
};
