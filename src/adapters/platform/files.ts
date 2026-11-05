import type { Attachment } from "../../core/skeleton";
export const fileCapabilities = { pdf: false, images: true };
// #ifdef H5 || MP-WEIXIN
fileCapabilities.pdf = true;
// #endif
function item(
  path: string,
  name: string,
  size: number,
  kind: "image" | "pdf",
): Attachment {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    path,
    name,
    size,
    kind,
  };
}
export function chooseImages(): Promise<Attachment[]> {
  return new Promise((resolve, reject) =>
    uni.chooseImage({
      count: 9,
      sizeType: ["original"],
      success: (r) => {
        const files = Array.isArray(r.tempFiles) ? r.tempFiles : [];
        resolve(
          files.map((f, i) =>
            item(
              Array.isArray(r.tempFilePaths) ? r.tempFilePaths[i] : "",
              `图片 ${i + 1}`,
              f.size,
              "image",
            ),
          ),
        );
      },
      fail: reject,
    }),
  );
}
export function choosePdf(): Promise<Attachment[]> {
  // #ifdef H5
  return new Promise((resolve, reject) =>
    uni.chooseFile({
      count: 9,
      type: "all",
      extension: [".pdf"],
      success: (r) => {
        const files = r.tempFiles as Array<{
          path: string;
          name: string;
          size: number;
        }>;
        resolve(files.map((f) => item(f.path, f.name, f.size, "pdf")));
      },
      fail: reject,
    }),
  );
  // #endif
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) =>
    uni.chooseMessageFile({
      count: 9,
      type: "file",
      extension: ["pdf"],
      success: (r) =>
        resolve(r.tempFiles.map((f) => item(f.path, f.name, f.size, "pdf"))),
      fail: reject,
    }),
  );
  // #endif
  // #ifdef APP-PLUS
  return Promise.reject(
    new Error("App 目前支持添加图片，PDF 文件选择待原生能力接入"),
  );
  // #endif
}
export function openAttachment(file: Attachment): void {
  if (file.kind === "image") {
    uni.previewImage({ urls: [file.path] });
    return;
  }
  // #ifdef H5
  window.open(file.path, "_blank", "noopener,noreferrer");
  // #endif
  // #ifndef H5
  uni.openDocument({
    filePath: file.path,
    fileType: "pdf",
    showMenu: true,
    fail: () => uni.showToast({ title: "此文件暂时无法打开", icon: "none" }),
  });
  // #endif
}
