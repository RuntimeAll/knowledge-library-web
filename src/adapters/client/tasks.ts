import type {
  ClientAttachment,
  ClientConfig,
  ClientTaskDetail,
  ClientTaskPage,
  ClientTaskReceipt,
  ClientTemplateOption,
} from "../../core/client-task";
import {
  clientApiBase,
  ClientApiError,
  requestData,
  unwrap,
  type Envelope,
} from "./http";
import { readClientSession } from "./session";
export const clientTasksApi = {
  findOwnAsset: (uploadKey: string) =>
    requestData<{ assetId: string; sha256: string; status: string } | null>(
      `/knowledge/asset/by-key?externalKey=${encodeURIComponent(uploadKey)}`,
    ),
  submit: (operationKey: string, config: ClientConfig) =>
    requestData<ClientTaskReceipt>("/knowledge/client/tasks", "POST", {
      operationKey,
      config,
    }),
  list: (pageNum = 1, pageSize = 10) =>
    requestData<ClientTaskPage>(
      `/knowledge/client/tasks?pageNum=${pageNum}&pageSize=${pageSize}`,
    ),
  detail: (id: string) =>
    requestData<ClientTaskDetail>(
      `/knowledge/client/tasks/${encodeURIComponent(id)}`,
    ),
  templates: (taskType: string, exerciseTypeCode: string) =>
    requestData<ClientTemplateOption[]>(
      `/knowledge/experience-versions/options?taskType=${encodeURIComponent(taskType)}&exerciseTypeCode=${encodeURIComponent(exerciseTypeCode)}`,
    ),
};
export async function uploadClientAttachment(
  file: ClientAttachment,
): Promise<{ assetId: string; sha256: string }> {
  if (file.assetId) return { assetId: file.assetId, sha256: file.sha256 || "" };
  const token = readClientSession()?.token;
  if (!token) throw new ClientApiError("请先登录", "401");
  return new Promise((resolve, reject) =>
    uni.uploadFile({
      url: `${clientApiBase()}/knowledge/asset/upload`,
      filePath: file.path,
      name: "file",
      header: { Authorization: `Bearer ${token}` },
      formData: { purpose: "SOURCE_ORIGINAL", idempotencyKey: file.uploadKey },
      success: (response) => {
        try {
          if (response.statusCode < 200 || response.statusCode >= 300)
            throw new ClientApiError(
              `资料上传失败（${response.statusCode}）`,
              String(response.statusCode),
            );
          const value = unwrap(
            JSON.parse(response.data) as Envelope<{
              assetId: string;
              sha256: string;
              status: string;
            }>,
          );
          if (!value || value.status !== "READY" || !value.assetId)
            throw new ClientApiError(
              "资料尚未就绪，请保留文件后重试",
              "ASSET_NOT_READY",
            );
          resolve({ assetId: String(value.assetId), sha256: value.sha256 });
        } catch (error) {
          reject(error);
        }
      },
      fail: () =>
        reject(
          new ClientApiError(
            "资料上传结果待核对，可按原上传键重试",
            "UPLOAD_UNKNOWN",
            true,
          ),
        ),
    }),
  );
}
export async function downloadClientFile(
  taskId: string,
  fileId: string,
  fileName: string,
): Promise<void> {
  const token = readClientSession()?.token;
  if (!token) throw new ClientApiError("请先登录", "401");
  const url = `${clientApiBase()}/knowledge/client/tasks/${encodeURIComponent(taskId)}/files/${encodeURIComponent(fileId)}`;
  // #ifdef H5
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new ClientApiError(
      `文件暂时无法下载（${response.status}）`,
      String(response.status),
    );
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json"))
    throw new ClientApiError(
      (await response.json()).msg || "文件暂时不可取用",
      "DOWNLOAD_REJECTED",
    );
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  return;
  // #endif
  // #ifndef H5
  const filePath = await new Promise<string>((resolve, reject) =>
    uni.downloadFile({
      url,
      header: { Authorization: `Bearer ${token}` },
      success: (result) =>
        result.statusCode === 200
          ? resolve(result.tempFilePath)
          : reject(new Error("文件暂时不可取用")),
      fail: reject,
    }),
  );
  await new Promise<void>((resolve, reject) =>
    uni.openDocument({
      filePath,
      showMenu: true,
      success: () => resolve(),
      fail: reject,
    }),
  );
  // #endif
}
