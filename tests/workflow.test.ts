import test from "node:test";
import assert from "node:assert/strict";
import { freshDraft, type DraftSpec } from "../src/core/skeleton";
import { WorkflowError, currentSubmission } from "../src/core/workflow";
import {
  MockWorkflowAdapter,
  type PreviewStoragePort,
} from "../src/adapters/mock/workflow";
function input(overrides: Partial<DraftSpec> = {}): DraftSpec {
  return {
    ...freshDraft(),
    title: "模拟课堂练习",
    goal: "保持难度，按母题顺序排版",
    ...overrides,
  };
}
function authenticated() {
  const port = new MockWorkflowAdapter();
  port.login("admin");
  return port;
}
function expectCode(code: string) {
  return (error: unknown) =>
    error instanceof WorkflowError && error.code === code;
}
function complete(
  port: MockWorkflowAdapter,
  receipt: { workOrderId: string; submissionId: string },
) {
  port.advance(receipt.workOrderId, receipt.submissionId, "receive");
  return port.advance(receipt.workOrderId, receipt.submissionId, "complete");
}
function sharedStorage() {
  let serialized: string | undefined;
  const storage: PreviewStoragePort = {
    read: () => serialized,
    write: (value) => {
      serialized = value;
    },
  };
  return { storage, persisted: () => JSON.parse(serialized!) };
}
test("logout in another tab revokes stale sessions without losing records or reviving authentication", () => {
  const { storage, persisted } = sharedStorage();
  const first = new MockWorkflowAdapter({ storage });
  const second = new MockWorkflowAdapter({ storage });
  first.login("admin");
  assert.equal(second.view().session?.kind, "mock");
  first.submit(input({ title: "标签一" }), { key: "tab-one" });
  second.submit(input({ title: "标签二" }), { key: "tab-two" });
  first.logout();
  assert.equal(
    persisted().orders.length,
    2,
    "logout keeps newer external records",
  );
  assert.throws(
    () => second.submit(input(), { key: "after-external-logout" }),
    expectCode("UNAUTHENTICATED"),
  );
  assert.equal(second.view().session, null);
  assert.deepEqual(second.view().orders, []);
  assert.equal(persisted().session, null);
  assert.equal(persisted().orders.length, 2);
  second.login("admin");
  assert.equal(
    second.view().orders.length,
    2,
    "explicit new login retains both records",
  );
  second.submit(input({ title: "重新登录后的记录" }), { key: "after-login" });
  first.logout();
  assert.equal(persisted().orders.length, 3);
  assert.equal(second.view().session, null);
  assert.equal(persisted().session, null);
});
test("two live tabs synchronize submissions, identities and frozen payloads before reading or writing", () => {
  const { storage, persisted } = sharedStorage();
  const first = new MockWorkflowAdapter({ storage });
  const second = new MockWorkflowAdapter({ storage });
  first.login("admin");
  const spec = input({
    attachments: [
      {
        id: "local-tab",
        name: "母题.pdf",
        kind: "pdf",
        size: 30,
        path: "blob:first-tab",
      },
    ],
  });
  const one = first.submit(spec, { key: "interleaved-one" });
  assert.equal(
    first.view().orders[0].submissions[0].snapshot.attachments[0].path,
    "blob:first-tab",
    "own writes do not invalidate current temporary files",
  );
  const frozen = persisted().orders[0].submissions[0].snapshot;
  second.login("admin");
  const two = second.submit(input({ title: "另一标签" }), {
    key: "interleaved-two",
  });
  const three = first.submit(input({ title: "再次提交" }), {
    key: "interleaved-three",
  });
  assert.equal(
    new Set([one.workOrderId, two.workOrderId, three.workOrderId]).size,
    3,
  );
  assert.equal(second.listOrders().total, 3);
  const projected = first
    .view()
    .orders.find((order) => order.id === one.workOrderId)!.submissions[0]
    .snapshot;
  assert.equal(
    projected.attachments[0].path,
    "",
    "external reload conservatively invalidates edit/view file paths",
  );
  assert.equal(
    second.submit(spec, { key: "interleaved-one" }).submissionId,
    one.submissionId,
    "cross-tab same-key retry keeps identity",
  );
  first.advance(one.workOrderId, one.submissionId, "receive");
  second.advance(one.workOrderId, one.submissionId, "complete");
  assert.equal(
    first.view().orders.find((order) => order.id === one.workOrderId)!
      .submissions[0].status,
    "completed",
  );
  assert.deepEqual(
    persisted().orders.find(
      (order: { id: string }) => order.id === one.workOrderId,
    ).submissions[0].snapshot,
    frozen,
  );
  assert.equal(persisted().orders.length, 3);
});
test("only isolated admin session can read/write, survives storage, expires and clears on logout", () => {
  let serialized: string | undefined;
  const storage: PreviewStoragePort = {
    read: () => serialized,
    write: (value) => {
      serialized = value;
    },
  };
  let now = 1000;
  const port = new MockWorkflowAdapter({
    storage,
    now: () => now,
    sessionLifetimeMs: 100,
  });
  assert.throws(() => port.login("teacher"), expectCode("UNKNOWN_ACCOUNT"));
  assert.throws(
    () => port.submit(input(), { key: "anonymous" }),
    expectCode("UNAUTHENTICATED"),
  );
  assert.equal(port.login("admin").kind, "mock");
  port.submit(input(), { key: "first" });
  const reloaded = new MockWorkflowAdapter({
    storage,
    now: () => now,
    sessionLifetimeMs: 100,
  });
  assert.equal(reloaded.view().orders.length, 1);
  now = 1101;
  assert.equal(reloaded.view().session, null);
  assert.deepEqual(reloaded.view().orders, []);
  assert.throws(() => reloaded.listOrders(), expectCode("UNAUTHENTICATED"));
  reloaded.login("admin");
  assert.equal(reloaded.view().orders.length, 1);
  reloaded.logout();
  assert.equal(reloaded.view().orders.length, 0);
  assert.equal(serialized?.includes("token"), false);
});
test("two revisions preserve frozen inputs and old results; current version never follows a late historical event", () => {
  const port = authenticated();
  const firstInput = input({
    mode: "variant",
    referenceIds: ["preview-question-2", "preview-question-1"],
    originalCount: 1,
    variantCount: 2,
    extensionCount: 1,
  });
  const r1 = port.submit(firstInput, { key: "r1" });
  firstInput.title = "caller mutated";
  firstInput.referenceIds.reverse();
  port.advance(r1.workOrderId, r1.submissionId, "receive");
  const r2 = port.submit(input({ title: "第二版", includeAnswers: false }), {
    key: "r2",
    workOrderId: r1.workOrderId,
    baseRevision: 1,
  });
  const second = complete(port, r2);
  const historical = port.advance(r1.workOrderId, r1.submissionId, "complete");
  const order = port.view().orders[0];
  assert.equal(order.currentRevision, 2);
  assert.equal(currentSubmission(order).result?.id, second.result?.id);
  assert.equal(order.submissions[0].snapshot.title, "模拟课堂练习");
  assert.deepEqual(
    historical.result?.groups.map((g) => g.sourceId),
    ["preview-question-2", "preview-question-1"],
  );
  assert.equal(historical.result?.totalCount, 8);
  assert.deepEqual(
    historical.result?.groups.map((g) => g.items.map((i) => i.ordinal)),
    [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ],
  );
  assert.deepEqual(
    historical.result?.groups[0].items.map((i) => i.kind),
    ["original", "variant", "variant", "extension"],
  );
  assert.deepEqual(second.result?.artifacts, ["student"]);
  assert.deepEqual(historical.result?.artifacts, ["student", "answer"]);
  assert.throws(
    () =>
      port.submit(input(), {
        key: "stale",
        workOrderId: r1.workOrderId,
        baseRevision: 1,
      }),
    expectCode("VERSION_CONFLICT"),
  );
  assert.throws(
    () => port.advance(r1.workOrderId, r1.submissionId, "fail"),
    expectCode("INVALID_TRANSITION"),
  );
});
test("duplicate key reuses one identity, conflicts reject, unknown response recovers the same persisted submission", () => {
  const port = authenticated();
  const spec = input();
  const first = port.submit(spec, { key: "duplicate" });
  const second = port.submit({ ...spec }, { key: "duplicate" });
  assert.equal(second.submissionId, first.submissionId);
  assert.equal(second.reused, true);
  assert.throws(
    () => port.submit({ ...spec, title: "changed" }, { key: "duplicate" }),
    expectCode("IDEMPOTENCY_CONFLICT"),
  );
  assert.equal(port.view().orders.length, 1);
  let unknownId = "";
  assert.throws(
    () =>
      port.submit(input({ title: "回执未知" }), {
        key: "lost-response",
        delivery: "unknown",
      }),
    (error: unknown) => {
      assert.ok(error instanceof WorkflowError);
      assert.equal(error.code, "RESULT_UNKNOWN");
      unknownId = error.receipt!.submissionId;
      return true;
    },
  );
  const recovered = port.recover("lost-response");
  assert.equal(recovered.submissionId, unknownId);
  assert.equal(port.view().orders.length, 2);
  assert.equal(
    port.view().orders.find((o) => o.id === recovered.workOrderId)
      ?.submissions[0].status,
    "queued",
  );
});
test("offline, missing materials, review and retry keep the same immutable submission", () => {
  const port = authenticated();
  const receipt = port.submit(input(), { key: "events", delivery: "offline" });
  const act = (action: Parameters<typeof port.advance>[2]) =>
    port.advance(receipt.workOrderId, receipt.submissionId, action);
  assert.throws(() => act("complete"), expectCode("INVALID_TRANSITION"));
  assert.equal(act("reconnect").status, "queued");
  assert.equal(act("wait_materials").status, "waiting_materials");
  assert.equal(act("retry").attempts, 2);
  assert.equal(act("receive").status, "running");
  assert.equal(act("wait_review").status, "awaiting_review");
  assert.equal(act("approve").status, "running");
  assert.equal(act("fail").status, "failed");
  assert.equal(act("retry").attempts, 3);
  act("receive");
  act("disconnect");
  assert.equal(act("reconnect").status, "running");
  const result = act("complete");
  assert.equal(result.id, receipt.submissionId);
  assert.equal(port.view().orders[0].submissions.length, 1);
});
test("intake emits a receipt without PDF or fake identified question count", () => {
  const port = authenticated();
  const receipt = port.submit(
    input({
      mode: "intake",
      attachments: [
        {
          id: "local-file",
          name: "输入.pdf",
          kind: "pdf",
          size: 10,
          path: "local-preview",
        },
      ],
    }),
    { key: "intake" },
  );
  const result = complete(port, receipt);
  assert.deepEqual(result.result?.artifacts, ["receipt"]);
  assert.equal(result.result?.totalCount, null);
  assert.deepEqual(result.result?.groups, []);
  port.confirmResult(receipt.workOrderId, receipt.submissionId);
  assert.throws(
    () => port.savePublication(result.result!.id, "回执", ""),
    expectCode("NO_PRODUCT"),
  );
});
test("uploads require explicit source count for variants; reference order, count bounds and mode requirements are validated", () => {
  const port = authenticated();
  const attachment = {
    id: "local-file",
    name: "输入.pdf",
    kind: "pdf" as const,
    size: 10,
    path: "local-preview",
  };
  assert.throws(
    () =>
      port.submit(input({ mode: "variant", attachments: [attachment] }), {
        key: "unknown-count",
      }),
    expectCode("INVALID_INPUT"),
  );
  assert.throws(
    () =>
      port.submit(
        input({
          mode: "variant",
          attachments: [attachment],
          referenceIds: ["preview-q1", "preview-q2"],
          sourceQuestionCount: 1,
        }),
        { key: "wrong-total" },
      ),
    expectCode("SOURCE_COUNT_REQUIRED"),
  );
  assert.throws(
    () =>
      port.submit(
        input({
          mode: "variant",
          referenceIds: ["preview-q1"],
          originalCount: 20,
          variantCount: 20,
          extensionCount: 20,
        }),
        { key: "too-many" },
      ),
    expectCode("INVALID_INPUT"),
  );
  assert.throws(
    () =>
      port.submit(
        input({ mode: "intake", attachments: [], referenceIds: [] }),
        { key: "no-input" },
      ),
    expectCode("INVALID_INPUT"),
  );
  assert.throws(
    () =>
      port.submit(input({ goal: "", points: [], point: "" }), {
        key: "no-requirements",
      }),
    expectCode("INVALID_INPUT"),
  );
  const receipt = port.submit(
    input({
      mode: "variant",
      attachments: [attachment],
      sourceQuestionCount: 3,
      originalCount: 0,
      variantCount: 2,
      extensionCount: 0,
    }),
    { key: "three-sources" },
  );
  assert.equal(complete(port, receipt).result?.totalCount, 6);
});
test("publication requires confirmed result and keeps one publication identity across revisions", () => {
  const port = authenticated();
  const first = port.submit(input(), { key: "pub-v1" });
  const v1 = complete(port, first);
  assert.throws(
    () => port.savePublication(v1.result!.id, "标题", "介绍"),
    expectCode("RESULT_NOT_CONFIRMED"),
  );
  port.confirmResult(first.workOrderId, first.submissionId);
  const pub1 = port.savePublication(v1.result!.id, "标题", "介绍");
  const second = port.submit(input({ title: "第二版" }), {
    key: "pub-v2",
    workOrderId: first.workOrderId,
    baseRevision: 1,
  });
  const v2 = complete(port, second);
  port.confirmResult(second.workOrderId, second.submissionId);
  const pub2 = port.savePublication(v2.result!.id, "新版标题", "新版介绍");
  assert.equal(pub1.id, pub2.id);
  assert.equal(pub2.status, "draft");
  assert.equal(pub2.resultId, v2.result!.id);
  assert.equal(port.view().publications.length, 1);
  assert.equal(port.view().orders[0].submissions[0].result!.id, v1.result!.id);
});
test("port owns finite paging and filtered totals; reading views cannot mutate the underlying record", () => {
  const port = authenticated();
  for (let i = 0; i < 12; i++)
    port.submit(input({ title: `练习 ${i}` }), { key: `page-${i}` });
  const page = port.listOrders({ page: 2, pageSize: 5 });
  assert.equal(page.total, 12);
  assert.equal(page.items.length, 5);
  assert.equal(port.listOrders({ query: "练习 11" }).total, 1);
  assert.equal(port.listOrders({ filter: "done" }).total, 0);
  assert.throws(
    () => port.listOrders({ pageSize: 5000 }),
    expectCode("INVALID_PAGE"),
  );
  const leaked = port.view();
  leaked.orders[0].submissions[0].snapshot.title = "changed externally";
  assert.notEqual(
    port.view().orders[0].submissions[0].snapshot.title,
    "changed externally",
  );
  const previousIds = new Set(port.view().orders.map((order) => order.id));
  port.resetDemo();
  assert.equal(port.view().orders.length, 0);
  assert.equal(port.view().session?.username, "admin");
  const next = port.submit(input(), { key: "after-reset" });
  assert.equal(previousIds.has(next.workOrderId), false);
});

test("restored metadata without a temporary path cannot create a new submission", () => {
  const port = authenticated();
  const file = {
    id: "local-old",
    name: "旧资料.pdf",
    kind: "pdf" as const,
    size: 100,
    path: "",
  };
  assert.throws(
    () =>
      port.submit(input({ mode: "intake", attachments: [file] }), {
        key: "stale-path",
      }),
    expectCode("ATTACHMENT_EXPIRED"),
  );
  assert.equal(port.view().orders.length, 0);
});

test("store returns an empty page and clears identity if a list is requested after expiry", async () => {
  const { createPinia } = await import("pinia");
  const { configureWorkflowPort, useWorkflowStore } = await import(
    "../src/stores/workflow"
  );
  let now = Date.now();
  const port = new MockWorkflowAdapter({
    now: () => now,
    sessionLifetimeMs: 100,
  });
  configureWorkflowPort(port);
  const store = useWorkflowStore(createPinia());
  store.login("admin");
  store.submit(input(), { key: "expiring-page" });
  now += 101;
  assert.deepEqual(store.listOrders({ page: 1, pageSize: 6 }), {
    items: [],
    total: 0,
    page: 1,
    pageSize: 6,
  });
  assert.equal(store.session, null);
  assert.deepEqual(store.orders, []);
});

test("restored historical file paths are unavailable only in the view projection, without changing frozen payloads or recovery identities", () => {
  let raw: string | undefined;
  const storage: PreviewStoragePort = {
    read: () => raw,
    write: (value) => {
      raw = value;
    },
  };
  const first = new MockWorkflowAdapter({ storage });
  first.login("admin");
  const draft = input({
    mode: "variant",
    sourceQuestionCount: 1,
    attachments: [
      {
        id: "local-first",
        name: "母题.pdf",
        kind: "pdf",
        size: 30,
        path: "blob:current-lifetime",
      },
    ],
  });
  const receipt = first.submit(draft, {
    key: "restored-unknown",
    delivery: "offline",
  });
  assert.equal(
    first.view().orders[0].submissions[0].snapshot.attachments[0].path,
    "blob:current-lifetime",
  );
  const before = JSON.parse(raw!);
  const restored = new MockWorkflowAdapter({ storage });
  const projected = restored.view().orders[0].submissions[0].snapshot;
  assert.equal(projected.attachments[0].path, "");
  assert.equal(
    restored.listOrders().items[0].submissions[0].snapshot.attachments[0].path,
    "",
  );
  assert.throws(
    () => restored.submit(projected, { key: "new-from-expired" }),
    expectCode("ATTACHMENT_EXPIRED"),
  );
  assert.equal(
    restored.recover("restored-unknown").submissionId,
    receipt.submissionId,
  );
  restored.advance(receipt.workOrderId, receipt.submissionId, "reconnect");
  complete(restored, receipt);
  assert.deepEqual(
    JSON.parse(raw!).orders[0].submissions[0].snapshot,
    before.orders[0].submissions[0].snapshot,
  );
  assert.deepEqual(
    JSON.parse(raw!).ledger["restored-unknown"],
    before.ledger["restored-unknown"],
  );
  const reselected = input({
    ...projected,
    attachments: [
      {
        ...projected.attachments[0],
        id: "local-new",
        path: "blob:new-lifetime",
      },
    ],
  });
  const newer = restored.submit(reselected, {
    key: "new-reselected",
    workOrderId: receipt.workOrderId,
    baseRevision: 1,
  });
  const view = restored.view().orders[0];
  assert.equal(view.submissions[0].snapshot.attachments[0].path, "");
  assert.equal(
    view.submissions.find((sub) => sub.id === newer.submissionId)!.snapshot
      .attachments[0].path,
    "blob:new-lifetime",
  );
});
