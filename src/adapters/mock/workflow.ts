import type { DraftSpec } from "../../core/skeleton";
import {
  availableActions,
  buildResult,
  currentSubmission,
  validateSubmission,
  WorkflowError,
  type MockPublication,
  type MockSession,
  type OrderPage,
  type OrderQuery,
  type Submission,
  type SubmissionReceipt,
  type SubmitOptions,
  type WorkflowAction,
  type WorkflowPort,
  type WorkflowView,
  type WorkOrder,
} from "../../core/workflow";

export interface PreviewStoragePort {
  read(): string | undefined;
  write(value: string): void;
}
interface LedgerEntry {
  fingerprint: string;
  receipt: SubmissionReceipt;
}
interface PersistedState extends WorkflowView {
  schema: 1;
  nextId: number;
  ledger: Record<string, LedgerEntry>;
}
interface MockOptions {
  storage?: PreviewStoragePort;
  now?: () => number;
  sessionLifetimeMs?: number;
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            canonical((value as Record<string, unknown>)[key]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
function emptyState(): PersistedState {
  return {
    schema: 1,
    nextId: 1,
    session: null,
    orders: [],
    publications: [],
    ledger: {},
  };
}
function freezeTree<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeTree);
    Object.freeze(value);
  }
  return value;
}
/** All data lives in an isolated mock namespace. No HTTP or production credentials. */
export class MockWorkflowAdapter implements WorkflowPort {
  private state: PersistedState = emptyState();
  private lastSerialized: string | undefined;
  // A loaded snapshot retains original metadata internally; only its edit/view
  // projection marks temporary files unavailable in this new app lifetime.
  private readonly restoredSubmissions = new Set<string>();
  private readonly now: () => number;
  private readonly lifetime: number;
  constructor(private readonly options: MockOptions = {}) {
    this.now = options.now || Date.now;
    this.lifetime = options.sessionLifetimeMs || 8 * 60 * 60 * 1000;
    this.loadStored(options.storage?.read());
  }
  private loadStored(raw: string | undefined): void {
    this.lastSerialized = raw;
    this.restoredSubmissions.clear();
    try {
      const parsed = raw ? (JSON.parse(raw) as PersistedState) : emptyState();
      if (
        parsed.schema !== 1 ||
        !Array.isArray(parsed.orders) ||
        !Array.isArray(parsed.publications) ||
        !Number.isInteger(parsed.nextId) ||
        !parsed.ledger
      )
        throw new Error("schema");
      for (const order of parsed.orders) {
        for (const submission of order.submissions) {
          this.restoredSubmissions.add(submission.id);
          freezeTree(submission.snapshot);
        }
      }
      this.state = parsed;
    } catch {
      // A bad preview cache never falls back to any real application data.
      this.state = emptyState();
      this.restoredSubmissions.clear();
    }
  }
  private synchronizeStorage(): void {
    if (!this.options.storage) return;
    const raw = this.options.storage.read();
    // Another tab can revoke the session or add records. Never authorize or
    // overwrite from an older in-memory copy; own writes keep temporary paths.
    if (raw !== this.lastSerialized) this.loadStored(raw);
  }
  private projectOrders(orders: WorkOrder[]): WorkOrder[] {
    const projected = copy(orders);
    for (const order of projected) {
      for (const sub of order.submissions) {
        if (this.restoredSubmissions.has(sub.id)) {
          sub.snapshot.attachments = sub.snapshot.attachments.map((file) => ({
            ...file,
            path: "",
          }));
        }
      }
    }
    return projected;
  }
  private persist(): void {
    const serialized = JSON.stringify(this.state);
    this.options.storage?.write(serialized);
    this.lastSerialized = serialized;
  }
  private id(kind: string): string {
    return `mock-${kind}-${this.state.nextId++}`;
  }
  private authorized(): MockSession {
    this.synchronizeStorage();
    const session = this.state.session;
    if (
      !session ||
      session.kind !== "mock" ||
      session.username !== "admin" ||
      session.expiresAt <= this.now()
    ) {
      this.state.session = null;
      this.persist();
      throw new WorkflowError("UNAUTHENTICATED", "请先以 admin 登录演示");
    }
    return session;
  }
  private order(id: string): WorkOrder {
    const order = this.state.orders.find((item) => item.id === id);
    if (!order) throw new WorkflowError("NOT_FOUND", "没有找到这条模拟记录");
    return order;
  }
  private submission(order: WorkOrder, id: string): Submission {
    const sub = order.submissions.find((item) => item.id === id);
    if (!sub) throw new WorkflowError("NOT_FOUND", "没有找到这个模拟版本");
    return sub;
  }
  view(): WorkflowView {
    try {
      this.authorized();
    } catch {
      return { session: null, orders: [], publications: [] };
    }
    return {
      session: copy(this.state.session),
      orders: this.projectOrders(this.state.orders),
      publications: copy(this.state.publications),
    };
  }
  login(username: string): MockSession {
    this.synchronizeStorage();
    if (username.trim() !== "admin")
      throw new WorkflowError("UNKNOWN_ACCOUNT", "本轮只提供 admin 模拟账号");
    this.state.session = {
      kind: "mock",
      username: "admin",
      expiresAt: this.now() + this.lifetime,
    };
    this.persist();
    return copy(this.state.session);
  }
  logout(): void {
    this.synchronizeStorage();
    this.state.session = null;
    this.persist();
  }
  submit(spec: DraftSpec, options: SubmitOptions): SubmissionReceipt {
    this.authorized();
    if (!options.key.trim() || options.key.length > 160)
      throw new WorkflowError("INVALID_KEY", "缺少有效的提交标识");
    validateSubmission(spec);
    const fingerprint = canonical({
      spec,
      workOrderId: options.workOrderId || null,
      baseRevision: options.baseRevision ?? null,
    });
    const previous = this.state.ledger[options.key];
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new WorkflowError(
          "IDEMPOTENCY_CONFLICT",
          "这次提交标识已用于另一份配置，请保留原记录并重新提交",
        );
      return { ...copy(previous.receipt), reused: true };
    }
    const now = this.now();
    let order: WorkOrder;
    if (options.workOrderId) {
      order = this.order(options.workOrderId);
      if (options.baseRevision !== order.currentRevision)
        throw new WorkflowError(
          "VERSION_CONFLICT",
          "此记录已有更新版本，请查看最新配置后再修改",
        );
    } else {
      if (options.baseRevision !== undefined)
        throw new WorkflowError("INVALID_VERSION", "新记录不能携带旧版本号");
      order = {
        id: this.id("order"),
        currentRevision: 0,
        createdAt: now,
        updatedAt: now,
        submissions: [],
      };
      this.state.orders.unshift(order);
    }
    const revision = order.currentRevision + 1;
    const status = options.delivery || "queued";
    const submission: Submission = {
      id: this.id("submission"),
      revision,
      key: options.key,
      status,
      snapshot: freezeTree(copy(spec)),
      createdAt: now,
      updatedAt: now,
      attempts: 1,
      statusNote:
        status === "unknown"
          ? "已保存模拟提交，但回执暂时丢失；用原提交标识核对"
          : status === "offline"
            ? "模拟执行端离线，等待恢复连接"
            : "已保存模拟配置，等待演示执行",
      ...(status === "unknown" || status === "offline"
        ? { resumeStatus: "queued" as const }
        : {}),
    };
    order.submissions.push(submission);
    order.currentRevision = revision;
    order.updatedAt = now;
    const receipt: SubmissionReceipt = {
      workOrderId: order.id,
      submissionId: submission.id,
      revision,
      reused: false,
    };
    this.state.ledger[options.key] = { fingerprint, receipt };
    this.persist();
    if (status === "unknown")
      throw new WorkflowError(
        "RESULT_UNKNOWN",
        "模拟回执暂未返回，请核对本次提交，不要重复新建任务",
        copy(receipt),
      );
    return copy(receipt);
  }
  advance(
    orderId: string,
    submissionId: string,
    action: WorkflowAction,
  ): Submission {
    this.authorized();
    const order = this.order(orderId);
    const sub = this.submission(order, submissionId);
    if (!availableActions(sub.status).includes(action))
      throw new WorkflowError(
        "INVALID_TRANSITION",
        "当前状态不能执行这个演示动作",
      );
    const now = this.now();
    switch (action) {
      case "receive":
        sub.status = "running";
        sub.statusNote = "模拟执行端已接收，正在展示处理流程";
        break;
      case "complete":
        sub.status = "completed";
        sub.result = buildResult(sub, this.id("result"), now);
        sub.statusNote = "已产生模拟结果，未调用真实制作服务";
        break;
      case "fail":
        sub.status = "failed";
        sub.statusNote = "模拟处理失败；可以沿用本次冻结输入重试";
        break;
      case "wait_materials":
        sub.status = "waiting_materials";
        sub.statusNote = "模拟资料待核对；可修改配置创建新版本，或重试同一输入";
        break;
      case "wait_review":
        sub.status = "awaiting_review";
        sub.statusNote = "模拟审核等待，不代表正式题目批准";
        break;
      case "approve":
        sub.status = "running";
        sub.statusNote = "已通过演示审核，继续模拟处理";
        break;
      case "retry":
        sub.status = "queued";
        sub.attempts++;
        sub.statusNote = "沿用本次冻结输入重新等待处理";
        break;
      case "disconnect":
        sub.resumeStatus = sub.status as "queued" | "running";
        sub.status = "offline";
        sub.statusNote = "模拟离线；已有输入和进度已保留";
        break;
      case "reconnect":
        sub.status = sub.resumeStatus || "queued";
        delete sub.resumeStatus;
        sub.statusNote = "模拟连接恢复，继续原提交";
        break;
      case "recover":
        sub.status = sub.resumeStatus || "queued";
        delete sub.resumeStatus;
        sub.statusNote = "已核对到原提交，没有新增工作单";
        break;
    }
    sub.updatedAt = now;
    // Historical callbacks may update their own result only. They never select a current revision.
    if (order.currentRevision === sub.revision) order.updatedAt = now;
    this.persist();
    return copy(sub);
  }
  recover(key: string): SubmissionReceipt {
    this.authorized();
    const entry = this.state.ledger[key];
    if (!entry)
      throw new WorkflowError(
        "NOT_FOUND",
        "没有找到该标识的模拟提交，可保留输入后重新提交",
      );
    const order = this.order(entry.receipt.workOrderId);
    const sub = this.submission(order, entry.receipt.submissionId);
    if (sub.status === "unknown") this.advance(order.id, sub.id, "recover");
    return { ...copy(entry.receipt), reused: true };
  }
  confirmResult(orderId: string, submissionId: string): Submission {
    this.authorized();
    const sub = this.submission(this.order(orderId), submissionId);
    if (!sub.result || sub.status !== "completed")
      throw new WorkflowError("RESULT_NOT_READY", "模拟结果尚未完成");
    sub.confirmedAt = sub.confirmedAt ?? this.now();
    this.persist();
    return copy(sub);
  }
  savePublication(
    resultId: string,
    title: string,
    intro: string,
  ): MockPublication {
    this.authorized();
    const order = this.state.orders.find((item) =>
      item.submissions.some((sub) => sub.result?.id === resultId),
    );
    const sub = order?.submissions.find((item) => item.result?.id === resultId);
    if (!order || !sub || sub.confirmedAt === undefined)
      throw new WorkflowError("RESULT_NOT_CONFIRMED", "请先确认这份模拟结果");
    if (sub.snapshot.mode === "intake")
      throw new WorkflowError("NO_PRODUCT", "只录题回执不是可发布成品");
    if (!title.trim() || title.trim().length > 120 || intro.length > 1000)
      throw new WorkflowError(
        "INVALID_PUBLICATION",
        "请填写 120 字以内的标题，介绍不超过 1000 字",
      );
    let publication = this.state.publications.find(
      (item) => item.workOrderId === order.id,
    );
    if (!publication) {
      publication = {
        id: this.id("publication"),
        workOrderId: order.id,
        resultId,
        title: "",
        intro: "",
        status: "draft",
        updatedAt: this.now(),
        label: "模拟发布草稿，未对外发布",
      };
      this.state.publications.push(publication);
    }
    Object.assign(publication, {
      resultId,
      title: title.trim(),
      intro,
      updatedAt: this.now(),
    });
    this.persist();
    return copy(publication);
  }
  listOrders(query: OrderQuery = {}): OrderPage {
    this.authorized();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    )
      throw new WorkflowError(
        "INVALID_PAGE",
        "分页参数不合法（每页最多 50 条）",
      );
    const filtered = this.state.orders
      .filter((order) => {
        const sub = currentSubmission(order);
        return (
          sub.snapshot.title.includes((query.query || "").trim()) &&
          (!query.filter ||
            query.filter === "all" ||
            (query.filter === "done"
              ? sub.status === "completed"
              : sub.status !== "completed"))
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      items: this.projectOrders(
        filtered.slice((page - 1) * pageSize, page * pageSize),
      ),
      total: filtered.length,
      page,
      pageSize,
    };
  }
  resetDemo(): void {
    this.authorized();
    const session = this.state.session;
    this.state = { ...emptyState(), session, nextId: this.state.nextId };
    this.persist();
  }
}
