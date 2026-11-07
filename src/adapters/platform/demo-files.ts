import { buildDemoPdf } from "../../core/demo-document";
import { displayTitle, type DraftSpec } from "../../core/skeleton";
import type { MockResult, ResultArtifact } from "../../core/workflow";
function utf8(value: string): Uint8Array {
  const escaped = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let i = 0; i < escaped.length; i++) {
    if (escaped[i] === "%") {
      bytes.push(parseInt(escaped.slice(i + 1, i + 3), 16));
      i += 2;
    } else bytes.push(escaped.charCodeAt(i));
  }
  return new Uint8Array(bytes);
}
function bytesFor(
  spec: DraftSpec,
  result: MockResult,
  kind: ResultArtifact,
): Uint8Array {
  if (!result.artifacts.includes(kind)) throw new Error("这版结果没有该文件");
  if (kind === "receipt")
    return utf8(
      JSON.stringify(
        {
          label: "模拟录题回执，未写入正式题库",
          resultId: result.id,
          submissionId: result.submissionId,
          mode: result.mode,
          title: spec.title,
          displayTitle: displayTitle(spec, result.submissionId),
          referenceIds: spec.referenceIds,
          attachments: spec.attachments.map(({ name, size, kind }) => ({
            name,
            size,
            kind,
          })),
          goal: spec.goal,
          totalCount: result.totalCount,
        },
        null,
        2,
      ),
    );
  return buildDemoPdf(spec, result, kind);
}
export function downloadDemoFile(
  spec: DraftSpec,
  result: MockResult,
  kind: ResultArtifact,
): void {
  const bytes = bytesFor(spec, result, kind);
  const name = `模拟-${displayTitle(spec, result.submissionId).replace(/[\\/:*?"<>|]/g, "-")}-${kind === "student" ? "学生版" : kind === "answer" ? "教师版" : "录题回执"}.${kind === "receipt" ? "json" : "pdf"}`;
  // #ifdef H5
  const blob = new Blob([new Uint8Array(bytes).buffer], {
    type:
      kind === "receipt" ? "application/json;charset=utf-8" : "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  // #endif
  // #ifdef MP-WEIXIN
  const env = (uni as typeof uni & { env?: { USER_DATA_PATH: string } }).env;
  if (!env?.USER_DATA_PATH) {
    uni.showToast({ title: "当前环境不支持文件保存", icon: "none" });
    return;
  }
  const filePath = `${env.USER_DATA_PATH}/${name}`;
  uni.getFileSystemManager().writeFile({
    filePath,
    data: new Uint8Array(bytes).buffer,
    success: () => {
      if (kind === "receipt")
        uni.showToast({ title: "回执已保存至小程序文件", icon: "none" });
      else uni.openDocument({ filePath, fileType: "pdf", showMenu: true });
    },
    fail: () => uni.showToast({ title: "演示文件保存失败", icon: "none" }),
  });
  // #endif
  // #ifdef APP-PLUS
  uni.showToast({
    title: "当前App演示文件取用待适配，请用Web核对",
    icon: "none",
  });
  // #endif
}
