export type ClientMode = "PRACTICE" | "VARIANT" | "INTAKE" | "ERROR_COLLECTION";
export const clientModeLabels: Record<ClientMode, string> = {
  PRACTICE: "专项练习",
  VARIANT: "举一反三",
  INTAKE: "题目录入",
  ERROR_COLLECTION: "错题收集",
};
export const clientStatusLabels: Record<string, string> = {
  DRAFT: "草稿",
  QUEUED: "等待执行",
  RUNNING: "处理中",
  WAITING_INPUT: "待补材料",
  RESULT_READY: "结果已就绪",
  COMPLETED: "已完成",
  FAILED: "处理失败",
  CANCELLED: "已停止",
};
export interface ClientAttachment {
  id: string;
  name: string;
  kind: "image" | "pdf";
  path: string;
  size: number;
  assetId?: string;
  sha256?: string;
  uploadKey: string;
}
export interface ClientDraft {
  mode: ClientMode;
  title: string;
  requirements: string;
  subject: "MATH" | "SCIENCE";
  exerciseTypeCode: string;
  layoutVersionId: string;
  includeAnswer: boolean;
  selectionNote: string;
  attachments: ClientAttachment[];
  practice: { questionsPerCopy: number; copyCount: number };
  variant: {
    originalCount: number;
    variantCount: number;
    extensionCount: number;
  };
}
export interface ClientConfig {
  schemaVersion: "client-make/v1";
  mode: ClientMode;
  title: string;
  requirements: string;
  subject: "MATH" | "SCIENCE";
  exerciseTypeCode: string;
  templates: { layoutVersionId?: string };
  includeAnswer: boolean;
  attachments: { assetId: string; order: number; selectionNote?: string }[];
  selectionNote: string;
  modeOptions: Record<string, number>;
}
export interface ClientTaskSummary {
  id: string;
  displayTitle: string;
  mode: ClientMode;
  status: string;
  rowVersion: string;
  revision: number;
  currentSubmissionId: string;
  createdAt: number;
  updatedAt: number;
}
export interface ClientResultFile {
  id: string;
  sheetId: string;
  copyIndex: number;
  role: string;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  pageCount?: number;
  available: boolean;
}
export interface ClientResult {
  id: string;
  submissionId: string;
  resultVersion: number;
  state: string;
  summary: { message?: string; questionCount?: number; sourceCount?: number };
  files: ClientResultFile[];
}
export interface ClientTaskDetail extends ClientTaskSummary {
  configSnapshot: ClientConfig;
  stageMessage: string;
  results: ClientResult[];
}
export interface ClientTaskPage {
  rows: ClientTaskSummary[];
  total: number;
  pageNum: number;
  pageSize: number;
}
export interface ClientTaskReceipt {
  workOrderId: string;
  submissionId: string;
  executionId: string;
  revision: number;
  status: string;
  reused: boolean;
}
export interface ClientTemplateOption {
  id: string;
  experienceId: string;
  versionNo: number;
  name: string;
  status: string;
  applicability?: { taskType: ClientMode; exerciseTypeCode: string }[];
  applicabilityHash?: string;
}
export function newClientDraft(): ClientDraft {
  return {
    mode: "PRACTICE",
    title: "",
    requirements: "",
    subject: "MATH",
    exerciseTypeCode: "STANDARD",
    layoutVersionId: "",
    includeAnswer: true,
    selectionNote: "",
    attachments: [],
    practice: { questionsPerCopy: 10, copyCount: 20 },
    variant: { originalCount: 1, variantCount: 2, extensionCount: 1 },
  };
}
export function clientDraftError(draft: ClientDraft): string {
  if (draft.title.trim().length > 80) return "资料名称最多 80 字";
  if (draft.requirements.length > 4000) return "制作要求最多 4000 字";
  if (draft.selectionNote.length > 1000) return "处理范围最多 1000 字";
  if (draft.mode === "PRACTICE") {
    if (
      Object.values(draft.practice).some(
        (n) => !Number.isInteger(n) || n < 1 || n > 100,
      )
    )
      return "每份题量和制作份数需为 1～100 的整数";
    if (!draft.requirements.trim() && !draft.attachments.length)
      return "请填写制作要求或添加参考资料";
  } else if (!draft.attachments.length) return "请先添加需要处理的图片或 PDF";
  if (draft.mode === "VARIANT") {
    const counts = Object.values(draft.variant);
    if (counts.some((n) => !Number.isInteger(n) || n < 0 || n > 20))
      return "每母题的各项数量需为 0～20 的整数";
    const total = counts.reduce((a, b) => a + b, 0);
    if (total < 1 || total > 50) return "每道母题的组合总数需为 1～50 题";
  }
  if (draft.attachments.some((file) => !file.assetId && !file.path))
    return "有本机文件已失效，请重新选择";
  return "";
}
/** Picks only the active mode's fields; backend remains the final authority. */
export function clientConfig(draft: ClientDraft): ClientConfig {
  if (draft.attachments.some((file) => !file.assetId))
    throw new Error("资料尚未上传完成");
  return {
    schemaVersion: "client-make/v1",
    mode: draft.mode,
    title: draft.title.trim(),
    requirements: draft.requirements.trim(),
    subject: draft.subject,
    exerciseTypeCode: draft.mode === "INTAKE" ? "NONE" : draft.exerciseTypeCode,
    templates:
      draft.mode !== "INTAKE" && draft.layoutVersionId
        ? { layoutVersionId: draft.layoutVersionId }
        : {},
    includeAnswer: draft.mode === "INTAKE" ? false : draft.includeAnswer,
    attachments: draft.attachments.map((file, i) => ({
      assetId: file.assetId!,
      order: i + 1,
      selectionNote: draft.selectionNote.trim(),
    })),
    selectionNote: draft.selectionNote.trim(),
    modeOptions:
      draft.mode === "PRACTICE"
        ? { ...draft.practice }
        : draft.mode === "VARIANT"
          ? { ...draft.variant }
          : {},
  };
}
export function draftFromConfig(config: ClientConfig): ClientDraft {
  const draft = newClientDraft();
  return {
    ...draft,
    mode: config.mode,
    title: config.title,
    requirements: config.requirements,
    subject: config.subject,
    exerciseTypeCode: config.exerciseTypeCode,
    layoutVersionId: config.templates?.layoutVersionId || "",
    includeAnswer: config.includeAnswer,
    selectionNote: config.selectionNote || "",
    attachments: config.attachments.map((file, i) => ({
      id: `asset-${file.assetId}`,
      assetId: file.assetId,
      name: `已上传资料 ${i + 1}`,
      kind: "pdf",
      path: "",
      size: 0,
      uploadKey: "",
    })),
    practice:
      config.mode === "PRACTICE"
        ? {
            questionsPerCopy: config.modeOptions.questionsPerCopy,
            copyCount: config.modeOptions.copyCount,
          }
        : draft.practice,
    variant:
      config.mode === "VARIANT"
        ? {
            originalCount: config.modeOptions.originalCount,
            variantCount: config.modeOptions.variantCount,
            extensionCount: config.modeOptions.extensionCount,
          }
        : draft.variant,
  };
}
