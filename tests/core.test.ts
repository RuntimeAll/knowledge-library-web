import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/api/client";
import { createSession } from "../src/adapters/web/session";
import {
  normalizeApiBase,
  validatePreview,
  describePreview,
} from "../src/core/preview";
import type { TransportPort } from "../src/core/ports";

test("API configuration can switch origin without page changes; missing configuration makes no request", async () => {
  const calls: string[] = [];
  const transport: TransportPort = {
    async request<T>({ url }) {
      calls.push(url);
      return { code: 200, data: "readback" } as T;
    },
  };
  const session = createSession();
  await assert.rejects(
    createApiClient("", transport, session).request("/fixture"),
    /尚未配置/,
  );
  assert.equal(calls.length, 0);
  assert.equal(
    await createApiClient(
      "https://example.invalid/api/",
      transport,
      session,
    ).request("/fixture"),
    "readback",
  );
  await createApiClient("/dev-api", transport, session).request("/fixture");
  assert.deepEqual(calls, [
    "https://example.invalid/api/fixture",
    "/dev-api/fixture",
  ]);
  await assert.rejects(
    createApiClient("/api", transport, session).request("//other.invalid"),
    /相对业务路径/,
  );
});

test("HTTP success cannot turn a business failure into success", async () => {
  const transport: TransportPort = {
    async request<T>() {
      return { code: 403, msg: "无权限" } as T;
    },
  };
  await assert.rejects(
    createApiClient("/api", transport, createSession()).request("/fixture"),
    /无权限/,
  );
});

test("session is injected, cleared and isolated per instance", async () => {
  const session = createSession();
  session.write("test-token-only");
  assert.equal(createSession().read(), undefined);
  let actual: string | undefined;
  const transport: TransportPort = {
    async request<T>({ token }) {
      actual = token;
      return { code: 200, data: null } as T;
    },
  };
  const client = createApiClient("/api", transport, session);
  await client.request("/fixture");
  assert.equal(actual, "test-token-only");
  session.clear();
  await client.request("/fixture");
  assert.equal(actual, undefined);
});

test("preview rejects blank titles and keeps student/answer configuration distinct", () => {
  assert.ok(validatePreview({ title: " ", includeAnswers: true }));
  assert.equal(
    validatePreview({ title: "基础预览", includeAnswers: false }),
    undefined,
  );
  assert.match(
    describePreview({ title: " 标题 ", includeAnswers: false }),
    /^标题 · 学生版$/,
  );
  assert.match(
    describePreview({ title: "标题", includeAnswers: true }),
    /红色答案/,
  );
});

test("API base refuses embedded credentials and non-HTTP schemes", () => {
  assert.throws(
    () => normalizeApiBase("https://user:secret@example.invalid"),
    /凭据/,
  );
  assert.throws(() => normalizeApiBase("javascript:alert(1)"), /HTTP/);
  assert.throws(() => normalizeApiBase("//example.invalid"), /HTTP/);
});

// Shared skeleton rules remain independent of Vue, browser and native APIs.
import { freshDraft, draftError, matchResource } from "../src/core/skeleton";
import { sampleResources } from "../src/fixtures/skeleton";
test("draft validates mode-specific boundaries without changing the input", () => {
  const draft = freshDraft();
  assert.notEqual(draftError(draft), "");
  draft.title = "课堂练习";
  draft.count = 0;
  assert.notEqual(draftError(draft), "");
  draft.count = 100;
  assert.equal(draftError(draft), "");
  draft.count = 1.5;
  assert.notEqual(draftError(draft), "");
  draft.mode = "variant";
  draft.originalCount = 0;
  draft.variantCount = 0;
  draft.extensionCount = 0;
  assert.notEqual(draftError(draft), "");
  draft.variantCount = 2;
  assert.equal(draftError(draft), "");
  draft.variantCount = -1;
  assert.notEqual(draftError(draft), "");
  draft.mode = "intake";
  assert.equal(draftError(draft), "");
  draft.title = "题".repeat(81);
  assert.notEqual(draftError(draft), "");
});
test("library combines category, subject and trimmed search, without mixing resource kinds", () => {
  const filter = (
    category: "questions" | "products",
    subject: string,
    query: string,
  ) =>
    sampleResources.filter((x) => matchResource(x, category, subject, query));
  assert.equal(filter("questions", "全部", "").length, 2);
  assert.equal(filter("questions", "数学", " 有理数 ").length, 1);
  assert.equal(filter("questions", "科学", "有理数").length, 0);
  assert.equal(
    filter("products", "全部", "").every((x) => !x.usable),
    true,
  );
});
