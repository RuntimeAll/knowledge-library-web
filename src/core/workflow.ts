import {
  submissionError,
  sourceCount,
  practiceCopyCount,
  type DraftSpec,
  type MakeMode,
} from "./skeleton";

/** Preview identity only. This type must never be accepted as a backend token. */
export interface MockSession {
  kind: "mock";
  username: "admin";
  expiresAt: number;
}
export type WorkflowStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "offline"
  | "waiting_materials"
  | "awaiting_review"
  | "unknown";
export type WorkflowAction =
  | "receive"
  | "complete"
  | "fail"
  | "wait_materials"
  | "wait_review"
  | "approve"
  | "retry"
  | "disconnect"
  | "reconnect"
  | "recover";
export const workflowStatusLabels: Record<WorkflowStatus, string> = {
  queued: "等待处理",
  running: "处理中",
  completed: "已完成",
  failed: "处理失败",
  offline: "离线等待",
  waiting_materials: "待补材料",
  awaiting_review: "待审核",
  unknown: "提交结果待核对",
};
export const workflowActionLabels: Record<WorkflowAction, string> = {
  receive: "模拟接收任务",
  complete: "模拟处理完成",
  fail: "模拟处理失败",
  wait_materials: "模拟缺少材料",
  wait_review: "模拟等待审核",
  approve: "模拟审核通过",
  retry: "重试本次输入",
  disconnect: "模拟离线",
  reconnect: "恢复连接",
  recover: "核对提交结果",
};
export type ResultArtifact = "student" | "answer" | "receipt";
export interface ResultItem {
  kind: "original" | "variant" | "extension" | "practice";
  /** One-based index within the same kind/source. */
  index: number;
  /** One-based order within a sheet; variant source groups share the same sequence. */
  ordinal: number;
}
export interface ResultGroup {
  /** Specialized practice sheets have an independent ordinal and shared frozen requirements. */
  copyIndex?: number;
  sourceId: string;
  sourceIndex: number;
  items: ResultItem[];
}
export interface MockResult {
  id: string;
  submissionId: string;
  mode: MakeMode;
  groups: ResultGroup[];
  artifacts: ResultArtifact[];
  totalCount: number | null;
  practiceCopies?: number;
  createdAt: number;
  label: "模拟结果，不是正式教学资料";
}
export interface Submission {
  id: string;
  revision: number;
  key: string;
  status: WorkflowStatus;
  snapshot: DraftSpec;
  createdAt: number;
  updatedAt: number;
  statusNote: string;
  attempts: number;
  result?: MockResult;
  confirmedAt?: number;
  resumeStatus?: "queued" | "running";
}
export interface WorkOrder {
  id: string;
  currentRevision: number;
  createdAt: number;
  updatedAt: number;
  submissions: Submission[];
}
export interface MockPublication {
  id: string;
  workOrderId: string;
  resultId: string;
  title: string;
  intro: string;
  status: "draft";
  updatedAt: number;
  label: "模拟发布草稿，未对外发布";
}
export interface SubmitOptions {
  key: string;
  workOrderId?: string;
  baseRevision?: number;
  delivery?: "queued" | "offline" | "unknown";
}
export interface SubmissionReceipt {
  workOrderId: string;
  submissionId: string;
  revision: number;
  reused: boolean;
}
export interface WorkflowView {
  session: MockSession | null;
  orders: WorkOrder[];
  publications: MockPublication[];
}
export interface OrderPage {
  items: WorkOrder[];
  total: number;
  page: number;
  pageSize: number;
}
export interface OrderQuery {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: "all" | "pending" | "done";
}
/** Existing pages depend on this port, never on storage or a real Worker. */
export interface WorkflowPort {
  view(): WorkflowView;
  login(username: string): MockSession;
  logout(): void;
  submit(spec: DraftSpec, options: SubmitOptions): SubmissionReceipt;
  advance(
    orderId: string,
    submissionId: string,
    action: WorkflowAction,
  ): Submission;
  recover(key: string): SubmissionReceipt;
  confirmResult(orderId: string, submissionId: string): Submission;
  savePublication(
    resultId: string,
    title: string,
    intro: string,
  ): MockPublication;
  listOrders(query?: OrderQuery): OrderPage;
  resetDemo(): void;
}
export class WorkflowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly receipt?: SubmissionReceipt,
  ) {
    super(message);
    this.name = "WorkflowError";
  }
}
export function currentSubmission(order: WorkOrder): Submission {
  const submission = order.submissions.find(
    (item) => item.revision === order.currentRevision,
  );
  if (!submission)
    throw new WorkflowError("INVALID_ORDER", "模拟记录版本不完整，请重置演示");
  return submission;
}
export function availableActions(status: WorkflowStatus): WorkflowAction[] {
  switch (status) {
    case "queued":
      return ["receive", "disconnect", "wait_materials"];
    case "running":
      return [
        "complete",
        "fail",
        "wait_materials",
        "wait_review",
        "disconnect",
      ];
    case "failed":
      return ["retry"];
    case "offline":
      return ["reconnect"];
    case "waiting_materials":
      return ["retry"];
    case "awaiting_review":
      return ["approve"];
    case "unknown":
      return ["recover"];
    default:
      return [];
  }
}

/** Only selected question identities are known; attachments are not parsed by Mock. */
export function sourceIdsFor(spec: DraftSpec): string[] {
  const selected = [...spec.referenceIds];
  if (new Set(selected).size !== selected.length)
    throw new WorkflowError("INVALID_REFERENCES", "同一道母题不能重复选择");
  return selected;
}
export function validateSubmission(spec: DraftSpec): void {
  if (
    spec.attachments.some(
      (file) => typeof file.path !== "string" || !file.path.trim(),
    )
  ) {
    throw new WorkflowError(
      "ATTACHMENT_EXPIRED",
      "临时文件已失效，请移除后重新选择，再提交任务",
    );
  }
  const message = submissionError(spec);
  if (message) throw new WorkflowError("INVALID_INPUT", message);
  if (!["practice", "variant", "intake"].includes(spec.mode))
    throw new WorkflowError("INVALID_MODE", "不支持的制作模式");
  if (spec.attachments.length > 20)
    throw new WorkflowError("TOO_MANY_FILES", "最多添加 20 份资料");
  if (spec.referenceIds.some((id) => !id.startsWith("preview-")))
    throw new WorkflowError(
      "INVALID_REFERENCE",
      "模拟流程仅接受标为示例的参考题",
    );
  if (new Set(spec.referenceIds).size !== spec.referenceIds.length)
    throw new WorkflowError("INVALID_REFERENCES", "同一道母题不能重复选择");
  if (spec.mode === "variant") sourceIdsFor(spec);
}
/** Deterministic layout groups, not generated educational question content. */
export function buildResult(
  submission: Submission,
  resultId: string,
  now: number,
): MockResult {
  const spec = submission.snapshot;
  const groups: ResultGroup[] = [];
  let totalCount: number | null = 0;
  if (spec.mode === "variant") {
    let ordinal = 0;
    for (const [sourceIndex, sourceId] of sourceIdsFor(spec).entries()) {
      const items: ResultItem[] = [];
      for (const [kind, count] of [
        ["original", spec.originalCount],
        ["variant", spec.variantCount],
        ["extension", spec.extensionCount],
      ] as const) {
        for (let index = 1; index <= count; index++)
          items.push({ kind, index, ordinal: ++ordinal });
      }
      groups.push({ sourceId, sourceIndex: sourceIndex + 1, items });
    }
    totalCount = spec.attachments.length ? null : ordinal;
  } else if (spec.mode === "practice") {
    for (let copyIndex = 1; copyIndex <= practiceCopyCount(spec); copyIndex++) {
      groups.push({
        sourceId: `mock-practice-requirements-${copyIndex}`,
        sourceIndex: 1,
        copyIndex,
        items: Array.from({ length: spec.count }, (_, i) => ({
          kind: "practice",
          index: i + 1,
          ordinal: i + 1,
        })),
      });
    }
    totalCount = spec.count * practiceCopyCount(spec);
  } else {
    const count = sourceCount(spec);
    totalCount =
      count !== null &&
      Number.isInteger(count) &&
      count >= spec.referenceIds.length &&
      count > 0
        ? count
        : null;
  }
  return {
    id: resultId,
    submissionId: submission.id,
    mode: spec.mode,
    groups,
    totalCount,
    ...(spec.mode === "practice"
      ? { practiceCopies: practiceCopyCount(spec) }
      : {}),
    artifacts:
      spec.mode === "intake"
        ? ["receipt"]
        : spec.includeAnswers
          ? ["student", "answer"]
          : ["student"],
    createdAt: now,
    label: "模拟结果，不是正式教学资料",
  };
}
