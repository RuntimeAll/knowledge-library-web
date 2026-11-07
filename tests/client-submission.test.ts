import test from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { useClientTasksStore } from "../src/stores/client-tasks";
import { clientTasksApi } from "../src/adapters/client/tasks";
import { ClientApiError } from "../src/adapters/client/http";
import { saveClientSession } from "../src/adapters/client/session";
import type { ClientConfig } from "../src/core/client-task";

const storage = new Map<string, unknown>();
Object.assign(globalThis, {
  uni: {
    getStorageSync: (key: string) => storage.get(key),
    setStorageSync: (key: string, value: unknown) => storage.set(key, value),
    removeStorageSync: (key: string) => storage.delete(key),
  },
});
function store(username = "owner-a") {
  setActivePinia(createPinia());
  saveClientSession(`token-${username}`, { username, displayName: username });
  const client = useClientTasksStore();
  client.restoreSession();
  client.draft.requirements = "同一份练习要求";
  return client;
}
const receipt = {
  workOrderId: "work",
  submissionId: "sub",
  executionId: "execution",
  revision: 1,
  status: "QUEUED",
  reused: false,
};
test("提交超时后原样重放被冻结输入和操作键，表单后续变化不改旧请求", async () => {
  const client = store();
  const calls: { key: string; config: ClientConfig }[] = [];
  const original = clientTasksApi.submit;
  clientTasksApi.submit = async (key, config) => {
    calls.push({ key, config });
    if (calls.length === 1)
      throw new ClientApiError("unknown", "NETWORK_UNKNOWN", true);
    return { ...receipt, reused: true };
  };
  try {
    await assert.rejects(client.submit(), /unknown/);
    assert.ok(client.pending);
    client.draft.requirements = "后来输入的新要求";
    const value = await client.submit();
    assert.equal(value.reused, true);
    assert.equal(calls[0].key, calls[1].key);
    assert.equal(calls[1].config.requirements, "同一份练习要求");
    assert.equal(client.pending, null);
  } finally {
    clientTasksApi.submit = original;
  }
});
test("账号切换清空视图，原账号未知提交不会恢复到另一账号", async () => {
  const first = store();
  const original = clientTasksApi.submit;
  clientTasksApi.submit = async () => {
    throw new ClientApiError("unknown", "NETWORK_UNKNOWN", true);
  };
  try {
    await assert.rejects(first.submit());
    first.logout();
    const second = store("owner-b");
    second.restoreDraft();
    assert.equal(second.pending, null);
    assert.deepEqual(second.rows, []);
    const restored = store("owner-a");
    restored.restoreDraft();
    assert.ok(restored.pending);
  } finally {
    clientTasksApi.submit = original;
  }
});

test("服务端异常结果不明时保留提交键，避免新键造成重复任务", async () => {
  const client = store("server-failure-owner");
  const original = clientTasksApi.submit;
  clientTasksApi.submit = async () => {
    throw new ClientApiError("server error", "500", true);
  };
  try {
    await assert.rejects(client.submit(), /server error/);
    assert.ok(client.pending?.operationKey);
  } finally {
    clientTasksApi.submit = original;
  }
});

test("冷启动自动恢复原账号的待查回请求，不产生新的提交键", async () => {
  const first = store("cold-start-owner");
  const original = clientTasksApi.submit;
  clientTasksApi.submit = async () => {
    throw new ClientApiError("unknown", "NETWORK_UNKNOWN", true);
  };
  try {
    await assert.rejects(first.submit());
    const key = first.pending!.operationKey;
    const next = store("cold-start-owner");
    assert.equal(next.pending?.operationKey, key);
    assert.equal(next.pending?.config.requirements, "同一份练习要求");
  } finally {
    clientTasksApi.submit = original;
  }
});
test("前台恢复检测到另一标签页换账号后，清空旧任务、草稿和pending", async () => {
  const first = store("tab-owner-a");
  const original = clientTasksApi.submit;
  clientTasksApi.submit = async () => {
    throw new ClientApiError("unknown", "NETWORK_UNKNOWN", true);
  };
  try {
    await assert.rejects(first.submit());
    first.rows = [{ id: "private-a" } as never];
    saveClientSession("token-tab-b", {
      username: "tab-owner-b",
      displayName: "B",
    });
    first.restoreSession();
    assert.equal(first.identity?.username, "tab-owner-b");
    assert.equal(first.pending, null);
    assert.equal(first.draft.requirements, "");
    assert.deepEqual(first.rows, []);
    assert.deepEqual(first.details, {});
  } finally {
    clientTasksApi.submit = original;
  }
});

test("上传回执丢失后冷恢复按原上传键取回资产，不重传或丢失附件", async () => {
  const client = store("asset-recovery-owner");
  client.draft.attachments.push({
    id: "local",
    name: "source.pdf",
    kind: "pdf",
    path: "",
    size: 123,
    uploadKey: "stable-upload",
  });
  const originalSubmit = clientTasksApi.submit,
    originalFind = clientTasksApi.findOwnAsset;
  let receivedAsset = "";
  clientTasksApi.findOwnAsset = async (key) => {
    assert.equal(key, "stable-upload");
    return { assetId: "preserved-asset", sha256: "hash", status: "READY" };
  };
  clientTasksApi.submit = async (_key, config) => {
    receivedAsset = config.attachments[0].assetId;
    return receipt;
  };
  try {
    await client.submit();
    assert.equal(receivedAsset, "preserved-asset");
  } finally {
    clientTasksApi.submit = originalSubmit;
    clientTasksApi.findOwnAsset = originalFind;
  }
});
