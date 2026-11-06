import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Production H5, fresh isolated contexts, real controls, read-only persisted receipts.
const root = path.resolve("dist/build/h5");
const out = path.resolve(process.env.KB_UI_EVIDENCE_DIR || "test-results");
await mkdir(out, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
    res
      .writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      })
      .end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });
const contexts = [];
const errors = [];
const requests = [];
const report = {
  kind: "isolated-admin-simulation",
  scenarios: [],
  downloads: [],
  screenshots: [],
};
const button = (page, text) =>
  page.locator("uni-button:visible").filter({ hasText: text });
const titleInput = (page) =>
  page.locator('[data-testid="draft-title"] input:visible');
async function visiblePage(page, title) {
  await expect(page.locator(".kb-title:visible").last()).toHaveText(title);
}
async function newAdmin() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    acceptDownloads: true,
  });
  contexts.push(context);
  const page = await context.newPage();
  observe(page);
  await page.goto(url);
  await expect(page.locator(".login-title:visible")).toHaveText("欢迎回来");
  await button(page, "以 admin 进入演示").click();
  await visiblePage(page, "工作台");
  assert.equal((await state(page)).session.username, "admin");
  return page;
}
function observe(page) {
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" ||
      message.text().includes("Failed to resolve component")
    )
      errors.push(message.text());
  });
  page.on("request", (request) => {
    if (!/^https?:/.test(request.url())) return;
    const parsed = new URL(request.url());
    requests.push({ method: request.method(), path: parsed.pathname });
    if (parsed.origin !== new URL(url).origin)
      errors.push(`External request: ${parsed.origin}`);
    if (
      request.method() !== "GET" ||
      /\/(api|login|production)\//.test(parsed.pathname)
    )
      errors.push(
        `Unexpected service request: ${request.method()} ${parsed.pathname}`,
      );
  });
}
async function state(page) {
  return page.evaluate(() => {
    const raw = globalThis.localStorage.getItem(
      "knowledge-library:admin-preview:workflow:v1",
    );
    if (!raw) throw new Error("Missing persisted simulation receipt");
    let parsed = JSON.parse(raw);
    if (parsed.type === "string") parsed = JSON.parse(parsed.data);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return parsed;
  });
}
async function shot(page, name, fullPage = true) {
  await page.evaluate(() => globalThis.document.fonts.ready);
  await expect(
    page.locator("uni-toast:visible, .uni-toast:visible"),
  ).toHaveCount(0);
  if (!fullPage)
    await page.locator(".kb-title:visible").last().scrollIntoViewIfNeeded();
  assert.equal(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <=
        globalThis.innerWidth,
    ),
    true,
    `${name}: no horizontal overflow`,
  );
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage,
  });
  report.screenshots.push(`${name}.png`);
}
async function selectMother(page, title) {
  const card = page
    .locator(".resource-card:visible")
    .filter({ hasText: title });
  await card.locator("uni-button").filter({ hasText: "选作参考" }).click();
  await expect(card).toContainText("已选");
}
async function complete(page, intake = false) {
  await visiblePage(page, "记录详情");
  await button(page, "模拟接收任务").click();
  await button(page, "模拟处理完成").click();
  await button(page, intake ? "查看录题回执" : "查看结果").click();
  await visiblePage(page, intake ? "录题回执" : "制作结果");
}
function utf16hex(text) {
  return Buffer.from(text, "utf16le").swap16().toString("hex").toUpperCase();
}
async function download(page, label, filename) {
  const pending = page.waitForEvent("download");
  await button(page, label).click();
  const file = await pending;
  assert.equal(await file.failure(), null);
  const target = path.join(out, filename);
  await file.saveAs(target);
  const bytes = await readFile(target);
  report.downloads.push({
    file: filename,
    suggestedFilename: file.suggestedFilename(),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  return bytes;
}

try {
  const page = await newAdmin();
  const initialGoal = "按选题顺序做同类练习，保留原题，每组留足书写空间。";
  const title = "admin 双母题顺序演示";
  await page.locator(".goal-field textarea:visible").fill(initialGoal);
  for (const [width, height] of [
    [650, 864],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await shot(page, `admin-home-${width}`, false);
  }
  await button(page, "从题库选").click();
  await visiblePage(page, "题库");
  await button(page, "数学").click();
  // Select the reverse of fixture order: the result must preserve this choice.
  await selectMother(page, "有理数的运算顺序");
  await selectMother(page, "有理数的混合运算");
  await expect(page.locator(".reference-bar:visible")).toContainText(
    "已选 2 道参考题",
  );
  await page
    .locator(".uni-tabbar__item:visible")
    .filter({ hasText: "工作台" })
    .click();
  await visiblePage(page, "工作台");
  await expect(page.locator(".goal-field textarea:visible")).toHaveValue(
    initialGoal,
  );
  await button(page, "举一反三").click();
  await visiblePage(page, "举一反三");
  await titleInput(page).fill(title);
  await expect(
    page.locator('[data-testid="recipe-total"]:visible'),
  ).toContainText("共 8 题");
  await page
    .locator(".collapse-heading:visible")
    .filter({ hasText: "补充要求" })
    .click();
  await expect(
    page.locator('[data-testid="draft-requirements"] textarea:visible'),
  ).toHaveValue(initialGoal);
  for (const [width, height] of [
    [650, 864],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await shot(page, `admin-configure-${width}`, false);
    await shot(page, `admin-configure-full-${width}`);
  }
  await button(page, "保存草稿").click();
  await button(page, "提交模拟任务").click();
  await visiblePage(page, "记录详情");
  let receipt = await state(page);
  assert.equal(receipt.orders.length, 1);
  const orderId = receipt.orders[0].id;
  const first = globalThis.structuredClone(receipt.orders[0].submissions[0]);
  assert.equal(first.revision, 1);
  assert.deepEqual(first.snapshot.referenceIds, [
    "preview-question-3",
    "preview-question-1",
  ]);
  assert.equal(first.snapshot.goal, initialGoal);
  assert.equal(first.snapshot.title, title);
  assert.deepEqual(
    [
      first.snapshot.originalCount,
      first.snapshot.variantCount,
      first.snapshot.extensionCount,
    ],
    [1, 2, 1],
  );
  await complete(page);
  await expect(page.locator(".result-title:visible")).toHaveText(title);
  await expect(page.locator(".result-group:visible")).toHaveCount(2);
  await expect(page.locator(".group-title:visible")).toHaveText([
    "1. 有理数的运算顺序",
    "2. 有理数的混合运算",
  ]);
  receipt = await state(page);
  const completedFirst = globalThis.structuredClone(
    receipt.orders[0].submissions[0],
  );
  assert.equal(completedFirst.result.totalCount, 8);
  assert.deepEqual(
    completedFirst.result.groups.map((group) => group.sourceId),
    first.snapshot.referenceIds,
  );
  assert.deepEqual(
    completedFirst.result.groups.flatMap((group) =>
      group.items.map((item) => item.ordinal),
    ),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.deepEqual(
    completedFirst.result.groups[0].items.map((item) => item.kind),
    ["original", "variant", "variant", "extension"],
  );
  const student = await download(
    page,
    "下载学生版",
    "admin-variant-student.pdf",
  );
  const answers = await download(
    page,
    "下载答案版",
    "admin-variant-answer.pdf",
  );
  for (const bytes of [student, answers]) {
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(
      bytes.toString("latin1").toUpperCase().includes(utf16hex(title)),
      "PDF includes this submission's frozen title",
    );
  }
  assert.notDeepEqual(student, answers);
  const answerMarker = utf16hex("答案：模拟占位，尚未生成正式答案。");
  assert.equal(
    student.toString("latin1").toUpperCase().includes(answerMarker),
    false,
  );
  assert.equal(
    answers.toString("latin1").toUpperCase().includes(answerMarker),
    true,
  );
  await shot(page, "admin-result-first-390");
  await expect(button(page, "发布准备")).toHaveClass(/u-button--disabled/);
  await button(page, "确认这份模拟结果").click();
  await button(page, "发布准备").click();
  await visiblePage(page, "发布准备");
  await page
    .locator('[data-testid="publication-title"] input:visible')
    .fill("有理数同类练习 · 模拟发布草稿");
  await page
    .locator('[data-testid="publication-intro"] textarea:visible')
    .fill("按两个母题顺序组织，每组原题、两道变式和一道提升；仅用于流程演示。");
  await button(page, "保存模拟发布草稿").click();
  await expect(
    page.locator('[data-testid="publication-saved"]:visible'),
  ).toContainText("已保存");
  const publication = (await state(page)).publications[0];
  assert.equal(publication.workOrderId, orderId);
  assert.equal(publication.resultId, completedFirst.result.id);
  assert.equal(publication.status, "draft");
  await shot(page, "admin-publication-390");
  await button(page, "返回制作结果").click();
  await visiblePage(page, "制作结果");
  await button(page, "修改配置再提交").click();
  await visiblePage(page, "举一反三");
  await expect(titleInput(page)).toHaveValue(title);
  const revisedGoal = "第二版：继续保持两组顺序，只需要学生版，书写区加大。";
  await page
    .locator(".collapse-heading:visible")
    .filter({ hasText: "补充要求" })
    .click();
  await expect(
    page.locator('[data-testid="draft-requirements"] textarea:visible'),
  ).toHaveValue(initialGoal);
  await page
    .locator('[data-testid="draft-requirements"] textarea:visible')
    .click();
  await page
    .locator('[data-testid="draft-requirements"] textarea:visible')
    .press("ControlOrMeta+A");
  await page
    .locator('[data-testid="draft-requirements"] textarea:visible')
    .press("Backspace");
  await expect(
    page.locator('[data-testid="draft-requirements"] textarea:visible'),
  ).toHaveValue("");
  await expect(
    page.locator(
      '[data-testid="draft-requirements"] .u-textarea__count:visible',
    ),
  ).toHaveText("0/300");
  await page
    .locator('[data-testid="draft-requirements"] textarea:visible')
    .fill(revisedGoal);
  await expect(
    page.locator('[data-testid="draft-requirements"] textarea:visible'),
  ).toHaveValue(revisedGoal);
  await expect(
    page.locator(
      '[data-testid="draft-requirements"] .u-textarea__count:visible',
    ),
  ).toHaveText(`${revisedGoal.length}/300`);
  await page
    .locator(".collapse-heading:visible")
    .filter({ hasText: "补充要求" })
    .click();
  await expect(
    page
      .locator(".collapse-heading:visible")
      .filter({ hasText: "补充要求" })
      .locator(".collapsed-value"),
  ).toHaveText(revisedGoal);
  await page.locator(".u-switch:visible").click();
  await button(page, "演示情景：正常提交").click();
  await button(page, "离线等待").click();
  await button(page, "提交模拟任务").click();
  await visiblePage(page, "记录详情");
  receipt = await state(page);
  assert.equal(
    receipt.orders.length,
    1,
    "revision retains work-order identity",
  );
  assert.equal(receipt.orders[0].id, orderId);
  assert.equal(receipt.orders[0].currentRevision, 2);
  assert.equal(receipt.orders[0].submissions[1].status, "offline");
  assert.equal(receipt.orders[0].submissions[1].snapshot.includeAnswers, false);
  assert.equal(receipt.orders[0].submissions[1].snapshot.goal, revisedGoal);
  assert.deepEqual(
    receipt.orders[0].submissions[0].snapshot,
    completedFirst.snapshot,
  );
  assert.deepEqual(
    receipt.orders[0].submissions[0].result,
    completedFirst.result,
  );
  await button(page, "模拟恢复在线").click();
  await complete(page);
  await expect(button(page, "下载学生版")).toBeVisible();
  await expect(button(page, "下载答案版")).toHaveCount(0);
  receipt = await state(page);
  const second = receipt.orders[0].submissions[1];
  assert.equal(second.result.totalCount, 8);
  assert.notEqual(second.result.id, completedFirst.result.id);
  assert.deepEqual(second.result.artifacts, ["student"]);
  await button(page, "第 1 版").click();
  await expect(button(page, "下载答案版")).toBeVisible();
  await expect(page.locator(".result-caption:visible")).toContainText(
    "第 1 版",
  );
  await button(page, "第 2 版").click();
  await expect(button(page, "下载答案版")).toHaveCount(0);
  await button(page, "确认这份模拟结果").click();
  await button(page, "发布准备").click();
  await button(page, "保存模拟发布草稿").click();
  receipt = await state(page);
  assert.equal(receipt.publications.length, 1);
  assert.equal(
    receipt.publications[0].id,
    publication.id,
    "publication reuses identity across revisions",
  );
  assert.equal(receipt.publications[0].resultId, second.result.id);
  await page.goto(`${url}#/pages/records/index`);
  await visiblePage(page, "制作记录");
  await expect(page.locator(".task-card:visible")).toHaveCount(1);
  await page.reload();
  await visiblePage(page, "制作记录");
  await expect(page.locator(".task-card:visible")).toContainText(title);
  await button(page, "待处理").click();
  await expect(page.locator(".task-card:visible")).toHaveCount(0);
  await button(page, "已完成").click();
  await expect(page.locator(".task-card:visible")).toHaveCount(1);
  await page.locator(".search-input input:visible").fill("没有匹配的记录");
  await expect(page.locator(".task-card:visible")).toHaveCount(0);
  await page.locator(".search-input input:visible").fill(title);
  await expect(page.locator(".task-card:visible")).toHaveCount(1);
  await shot(page, "admin-records-390");
  await page.goto(`${url}#/pages/mine/index`);
  await visiblePage(page, "我的");
  await button(page, "退出演示").click();
  await expect(page.locator(".login-title:visible")).toHaveText("欢迎回来");
  await page.goto(`${url}#/pages/records/index`);
  await expect(page.locator(".login-title:visible")).toHaveText("欢迎回来");
  await expect(page.locator(".task-card:visible")).toHaveCount(0);
  assert.equal(
    await page
      .locator("body")
      .innerText()
      .then((text) => text.includes(title)),
    false,
    "deep links do not expose records after logout",
  );
  report.scenarios.push({
    name: "variant-publication-revision-offline-logout",
    workOrderId: orderId,
    submissionIds: [first.id, second.id],
    resultIds: [completedFirst.result.id, second.result.id],
    publicationId: publication.id,
    totalCount: 8,
    sourceOrder: first.snapshot.referenceIds,
    passed: true,
  });

  const practice = await newAdmin();
  await practice
    .locator(".goal-field textarea:visible")
    .fill("做一份有理数基础专项练习，题目由易到难。");
  await button(practice, "专项练习").click();
  await visiblePage(practice, "专项练习");
  await expect(titleInput(practice)).toHaveValue("");
  await button(practice, "演示情景：正常提交").click();
  await button(practice, "提交结果未知").click();
  await button(practice, "提交模拟任务").click();
  await expect(button(practice, "查回这次提交")).toBeVisible();
  const unknown = await state(practice);
  assert.equal(unknown.orders.length, 1);
  assert.equal(unknown.orders[0].submissions[0].status, "unknown");
  assert.deepEqual(unknown.orders[0].submissions[0].snapshot.referenceIds, []);
  await button(practice, "查回这次提交").click();
  await visiblePage(practice, "记录详情");
  const recovered = await state(practice);
  assert.equal(recovered.orders.length, 1);
  assert.equal(recovered.orders[0].id, unknown.orders[0].id);
  assert.equal(
    recovered.orders[0].submissions[0].id,
    unknown.orders[0].submissions[0].id,
  );
  await button(practice, "模拟接收任务").click();
  await button(practice, "演练异常情景").click();
  await button(practice, "处理失败").click();
  await button(practice, "按原配置重试").click();
  await button(practice, "模拟接收任务").click();
  await button(practice, "资料不足").click();
  await button(practice, "模拟资料补齐").click();
  await button(practice, "模拟接收任务").click();
  await button(practice, "等待审核").click();
  await button(practice, "模拟审核通过").click();
  await button(practice, "模拟处理完成").click();
  await button(practice, "查看结果").click();
  await visiblePage(practice, "制作结果");
  const practiceDone = (await state(practice)).orders[0];
  assert.equal(practiceDone.submissions[0].result.mode, "practice");
  assert.equal(practiceDone.submissions[0].snapshot.title, "");
  await expect(practice.locator(".result-title")).toContainText("专项练习");
  assert.equal(practiceDone.submissions[0].result.totalCount, 200);
  assert.equal(practiceDone.submissions[0].snapshot.practiceCopies, 20);
  assert.equal(practiceDone.submissions[0].result.groups.length, 20);
  await expect(
    practice.locator('[data-testid="practice-copy-index"]'),
  ).toHaveText("第 1 份 / 共 20 份");
  const practiceFirst = await download(
    practice,
    "下载学生版",
    "admin-practice-sheet-1.pdf",
  );
  await button(practice, "下一份").click();
  await expect(
    practice.locator('[data-testid="practice-copy-index"]'),
  ).toHaveText("第 2 份 / 共 20 份");
  await expect(practice.locator(".result-group:visible")).toHaveCount(1);
  await expect(practice.locator(".group-items uni-text")).toHaveCount(10);
  const practiceSecond = await download(
    practice,
    "下载学生版",
    "admin-practice-sheet-2.pdf",
  );
  assert.notDeepEqual(practiceFirst, practiceSecond);
  assert.ok(
    practiceFirst
      .toString("latin1")
      .toUpperCase()
      .includes(utf16hex("第 1 份 / 共 20 份")),
  );
  assert.ok(
    practiceSecond
      .toString("latin1")
      .toUpperCase()
      .includes(utf16hex("第 2 份 / 共 20 份")),
  );
  assert.equal(practiceDone.submissions.length, 1);
  await shot(practice, "admin-practice-recovered-390");
  report.scenarios.push({
    name: "practice-goal-only-unknown-failure-materials-review",
    workOrderId: practiceDone.id,
    submissionId: practiceDone.submissions[0].id,
    totalCount: 200,
    practiceCopies: 20,
    attempts: practiceDone.submissions[0].attempts,
    passed: true,
  });

  const intake = await newAdmin();
  await button(intake, "从题库选").click();
  await visiblePage(intake, "题库");
  await selectMother(intake, "有理数的混合运算");
  await intake
    .locator(".uni-tabbar__item:visible")
    .filter({ hasText: "工作台" })
    .click();
  await button(intake, "只录题").click();
  await visiblePage(intake, "只录题");
  await titleInput(intake).fill("admin 只录题回执演示");
  await expect(intake.locator(".template-entry:visible")).toHaveCount(0);
  await expect(intake.locator(".u-switch:visible")).toHaveCount(0);
  await button(intake, "提交模拟任务").click();
  await complete(intake, true);
  await expect(button(intake, "下载学生版")).toHaveCount(0);
  await expect(button(intake, "下载答案版")).toHaveCount(0);
  await expect(button(intake, "发布准备")).toHaveCount(0);
  const intakeDone = (await state(intake)).orders[0].submissions[0];
  assert.deepEqual(intakeDone.result.artifacts, ["receipt"]);
  const jsonBytes = await download(
    intake,
    "下载录题回执",
    "admin-intake-receipt.json",
  );
  const json = JSON.parse(jsonBytes.toString());
  assert.equal(json.resultId, intakeDone.result.id);
  assert.equal(json.submissionId, intakeDone.id);
  assert.equal(json.title, intakeDone.snapshot.title);
  assert.deepEqual(json.referenceIds, ["preview-question-1"]);
  assert.equal(json.totalCount, 1);
  assert.match(json.label, /模拟/);
  await shot(intake, "admin-intake-receipt-390");
  report.scenarios.push({
    name: "intake-receipt-only",
    submissionId: intakeDone.id,
    resultId: intakeDone.result.id,
    totalCount: 1,
    passed: true,
  });

  const owner = await newAdmin();
  await owner
    .locator(".goal-field textarea:visible")
    .fill("保留一条记录，核对跨标签退出。");
  await button(owner, "专项练习").click();
  await titleInput(owner).fill("跨标签保留的原记录");
  await button(owner, "提交模拟任务").click();
  await visiblePage(owner, "记录详情");
  const crossTabOrderId = (await state(owner)).orders[0].id;
  const peer = await owner.context().newPage();
  observe(peer);
  await peer.goto(`${url}#/pages/records/index`);
  await visiblePage(peer, "制作记录");
  await expect(peer.locator(".task-card:visible")).toHaveCount(1);
  await owner.goto(`${url}#/pages/mine/index`);
  await button(owner, "退出演示").click();
  await expect(owner.locator(".login-title:visible")).toHaveText("欢迎回来");
  await peer
    .locator(".uni-tabbar__item:visible")
    .filter({ hasText: "工作台" })
    .click();
  await expect(peer.locator(".login-title:visible")).toHaveText("欢迎回来");
  assert.equal(
    (await state(peer)).session,
    null,
    "a stale tab cannot navigate with a revoked session",
  );
  await button(owner, "以 admin 进入演示").click();
  await visiblePage(owner, "工作台");
  await peer.goto(url);
  await visiblePage(peer, "工作台");
  await peer
    .locator(".goal-field textarea:visible")
    .fill("这次不应被提交或保存。");
  await button(peer, "专项练习").click();
  await titleInput(peer).fill("退出后拒绝的旧标签输入");
  await owner.goto(`${url}#/pages/mine/index`);
  await button(owner, "退出演示").click();
  await expect(owner.locator(".login-title:visible")).toHaveText("欢迎回来");
  await button(peer, "提交模拟任务").click();
  await expect(
    peer.locator('[data-testid="submit-error"]:visible'),
  ).toContainText("请先以 admin 登录演示");
  const rejected = await state(peer);
  assert.equal(rejected.session, null);
  assert.deepEqual(
    rejected.orders.map((order) => order.id),
    [crossTabOrderId],
  );
  await button(peer, "保存草稿").click();
  await expect(peer.locator(".login-title:visible")).toHaveText("欢迎回来");
  assert.equal(
    await peer.evaluate(() =>
      globalThis.localStorage.getItem("knowledge-library-demo-draft-v1"),
    ),
    null,
    "revoked tabs cannot recreate the cleared draft cache",
  );
  assert.equal((await state(peer)).session, null);
  report.scenarios.push({
    name: "cross-tab-logout-rejects-navigation-submit-and-draft-save",
    workOrderId: crossTabOrderId,
    preservedOrderCount: 1,
    passed: true,
  });

  assert.deepEqual(
    errors,
    [],
    "no browser errors, external traffic or service writes",
  );
  report.requestCount = requests.length;
  report.requestMethods = [
    ...new Set(requests.map((request) => request.method)),
  ];
  report.consoleErrors = errors;
  report.passed = true;
  await writeFile(
    path.join(out, "admin-flow-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  for (const [index, context] of contexts.entries()) {
    const active = context.pages().at(-1);
    if (active)
      await active
        .screenshot({
          path: path.join(out, `admin-failure-${index}.png`),
          fullPage: true,
        })
        .catch(() => {});
  }
  await writeFile(
    path.join(out, "admin-flow-failure.json"),
    JSON.stringify(
      { error: String(error), errors, scenarios: report.scenarios },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
