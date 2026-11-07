import { defineStore } from "pinia";
import {
  clientConfig,
  clientDraftError,
  draftFromConfig,
  newClientDraft,
  type ClientConfig,
  type ClientDraft,
  type ClientMode,
  type ClientTaskDetail,
  type ClientTaskSummary,
  type ClientTemplateOption,
} from "../core/client-task";
import {
  ClientApiError,
  requestEnvelope,
  unwrap,
} from "../adapters/client/http";
import {
  clearClientSession,
  readClientSession,
  saveClientSession,
  type ClientIdentity,
} from "../adapters/client/session";
import {
  clientTasksApi,
  uploadClientAttachment,
} from "../adapters/client/tasks";
interface PendingSubmission {
  operationKey: string;
  config: ClientConfig;
}
function operationKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function ownerKey(username: string, kind: string) {
  return `knowledge-library:client-${kind}:v1:${username}`;
}
export const useClientTasksStore = defineStore("client-tasks", {
  state: () => ({
    identity: null as ClientIdentity | null,
    observedToken: "",
    draft: newClientDraft(),
    rows: [] as ClientTaskSummary[],
    total: 0,
    pageNum: 1,
    pageSize: 10,
    details: {} as Record<string, ClientTaskDetail>,
    templates: [] as ClientTemplateOption[],
    pending: null as PendingSubmission | null,
    lastTaskId: "",
    loading: false,
    uploadingName: "",
    templateRequest: 0,
    listRequest: 0,
  }),
  getters: {
    authenticated: (state) => !!state.identity && !!state.observedToken,
  },
  actions: {
    clearAccountView() {
      this.rows = [];
      this.details = {};
      this.templates = [];
      this.pending = null;
      this.draft = newClientDraft();
      this.lastTaskId = "";
      this.total = 0;
      this.pageNum = 1;
      this.loading = false;
      this.uploadingName = "";
      this.listRequest++;
      this.templateRequest++;
    },
    restoreSession() {
      const saved = readClientSession();
      if (
        (saved?.token || "") === this.observedToken &&
        (saved?.identity.username || "") === (this.identity?.username || "")
      )
        return;
      this.clearAccountView();
      this.observedToken = saved?.token || "";
      this.identity = saved?.identity || null;
      if (this.identity) this.restoreDraft();
    },
    async login(username: string, password: string, code = "", uuid = "") {
      const body = await requestEnvelope<never>(
        "/login",
        "POST",
        { username, password, code, uuid },
        false,
      );
      unwrap(body);
      if (!body.token)
        throw new ClientApiError("登录未返回有效会话", "INVALID_SESSION");
      saveClientSession(body.token, { username, displayName: username });
      this.restoreSession();
      try {
        await this.verifySession();
        this.restoreDraft();
      } catch (error) {
        if (readClientSession()?.token === body.token) this.logout();
        else this.restoreSession();
        throw error;
      }
    },
    async verifySession() {
      const initialToken = readClientSession()?.token;
      const body = await requestEnvelope<never>("/getInfo");
      unwrap(body);
      const user = (
        body as typeof body & { user?: { userName: string; nickName?: string } }
      ).user;
      const saved = readClientSession();
      if (!saved || saved.token !== initialToken || !user?.userName)
        throw new ClientApiError("登录身份无效，请重新登录", "401");
      this.identity = {
        username: user.userName,
        displayName: user.nickName || user.userName,
      };
      saveClientSession(saved.token, this.identity);
    },
    logout() {
      if (readClientSession()?.token)
        void requestEnvelope("/logout", "POST").catch(() => undefined);
      clearClientSession();
      this.identity = null;
      this.observedToken = "";
      this.clearAccountView();
    },
    setMode(mode: ClientMode) {
      this.draft.mode = mode;
      this.draft.exerciseTypeCode = mode === "INTAKE" ? "NONE" : "STANDARD";
      this.draft.layoutVersionId = "";
      this.templates = [];
      this.lastTaskId = "";
    },
    saveDraft() {
      if (!this.identity) return;
      uni.setStorageSync(
        ownerKey(this.identity.username, "draft"),
        JSON.parse(JSON.stringify(this.draft)),
      );
    },
    restoreDraft() {
      this.draft = newClientDraft();
      this.pending = null;
      if (!this.identity) return;
      const stored = uni.getStorageSync(
        ownerKey(this.identity.username, "draft"),
      ) as ClientDraft | undefined;
      if (
        stored &&
        ["PRACTICE", "VARIANT", "INTAKE", "ERROR_COLLECTION"].includes(
          stored.mode,
        )
      ) {
        this.draft = {
          ...newClientDraft(),
          ...stored,
          attachments: (stored.attachments || []).map((file) => ({
            ...file,
            path: "",
          })),
        };
      }
      const pending = uni.getStorageSync(
        ownerKey(this.identity.username, "pending"),
      ) as PendingSubmission | undefined;
      this.pending = pending?.operationKey && pending.config ? pending : null;
      if (this.pending) this.draft = draftFromConfig(this.pending.config);
    },
    persistPending() {
      if (!this.identity) return;
      const key = ownerKey(this.identity.username, "pending");
      if (this.pending)
        uni.setStorageSync(key, JSON.parse(JSON.stringify(this.pending)));
      else uni.removeStorageSync(key);
    },
    async loadTemplates() {
      this.restoreSession();
      const request = ++this.templateRequest;
      const mode = this.draft.mode,
        exercise = this.draft.exerciseTypeCode;
      if (mode === "INTAKE") {
        this.templates = [];
        return;
      }
      const values = await clientTasksApi.templates(mode, exercise);
      if (
        request === this.templateRequest &&
        this.draft.mode === mode &&
        this.draft.exerciseTypeCode === exercise
      )
        this.templates = values;
    },
    async submit() {
      this.restoreSession();
      const initialToken = readClientSession()?.token;
      const draft = this.draft;
      const sameSession = () =>
        !!initialToken && initialToken === readClientSession()?.token;
      if (!sameSession()) throw new ClientApiError("请先登录", "401");
      if (!this.pending) {
        // A previous upload may have succeeded before the response or page was lost.
        for (const file of draft.attachments) {
          if (file.assetId || file.path || !file.uploadKey) continue;
          const asset = await clientTasksApi.findOwnAsset(file.uploadKey);
          if (!sameSession())
            throw new ClientApiError("登录身份已变化，请使用原账号查回", "401");
          if (asset?.status === "READY")
            Object.assign(file, {
              assetId: String(asset.assetId),
              sha256: asset.sha256,
            });
        }
        const error = clientDraftError(draft);
        if (error) throw new Error(error);
        this.saveDraft();
        for (const file of draft.attachments) {
          if (file.assetId) continue;
          this.uploadingName = file.name;
          try {
            Object.assign(file, await uploadClientAttachment(file));
          } finally {
            this.uploadingName = "";
          }
          if (!sameSession())
            throw new ClientApiError("登录身份已变化，请使用原账号查回", "401");
          this.saveDraft();
        }
        this.pending = {
          operationKey: operationKey("client-submit"),
          config: clientConfig(draft),
        };
        this.persistPending();
      }
      const pending = this.pending;
      try {
        const receipt = await clientTasksApi.submit(
          pending.operationKey,
          pending.config,
        );
        if (!sameSession())
          throw new ClientApiError("登录身份已变化，请使用原账号查回", "401");
        this.lastTaskId = receipt.workOrderId;
        this.pending = null;
        this.persistPending();
        this.saveDraft();
        return receipt;
      } catch (error) {
        if (
          sameSession() &&
          error instanceof ClientApiError &&
          !error.uncertain &&
          error.code !== "NETWORK_UNKNOWN"
        ) {
          this.pending = null;
          this.persistPending();
        }
        throw error;
      }
    },
    async loadPage(pageNum?: number) {
      this.restoreSession();
      const initialToken = readClientSession()?.token;
      const requestedPage = pageNum || this.pageNum;
      const request = ++this.listRequest;
      this.loading = true;
      try {
        const page = await clientTasksApi.list(requestedPage, this.pageSize);
        if (
          request !== this.listRequest ||
          initialToken !== readClientSession()?.token
        )
          return;
        this.rows = page.rows;
        this.total = page.total;
        this.pageNum = page.pageNum;
      } finally {
        if (request === this.listRequest) this.loading = false;
      }
    },
    async loadDetail(id: string) {
      this.restoreSession();
      const sessionToken = readClientSession()?.token;
      const value = await clientTasksApi.detail(id);
      if (sessionToken && sessionToken === readClientSession()?.token)
        this.details[id] = value;
      else throw new ClientApiError("登录身份已变化，请重新读取任务", "401");
      return value;
    },
  },
});
