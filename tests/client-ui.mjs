import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
const base = process.env.CLIENT_UI_BASE || "http://127.0.0.1:5195";
const output =
  process.env.CLIENT_UI_OUTPUT ||
  fileURLToPath(
    new URL(
      "../../.runtime/work/prd100-web-real-20261106/ui-contract/",
      import.meta.url,
    ),
  );
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let submitted,
  completed = false;
const now = Date.now();
const summary = () => ({
  id: "fixture-task",
  displayTitle: "专项练习 通信验收",
  mode: "PRACTICE",
  status: completed ? "RESULT_READY" : "QUEUED",
  rowVersion: "1",
  revision: 1,
  currentSubmissionId: "fixture-sub",
  createdAt: now,
  updatedAt: now,
});
await page.route("**/api/**", async (route) => {
  const path = new URL(route.request().url()).pathname;
  let body;
  if (path.endsWith("/captchaImage"))
    body = { code: 200, captchaEnabled: false };
  else if (path.endsWith("/login"))
    body = { code: 200, token: "ui-contract-token" };
  else if (path.endsWith("/getInfo"))
    body = {
      code: 200,
      user: { userName: "fixture-user", nickName: "界面验证账号" },
    };
  else if (path.endsWith("/experience-versions/options"))
    body = { code: 200, data: [] };
  else if (
    path.endsWith("/knowledge/client/tasks") &&
    route.request().method() === "POST"
  ) {
    submitted = route.request().postDataJSON();
    body = {
      code: 200,
      data: {
        workOrderId: "fixture-task",
        submissionId: "fixture-sub",
        executionId: "fixture-execution",
        revision: 1,
        status: "QUEUED",
        reused: false,
      },
    };
  } else if (path.endsWith("/knowledge/client/tasks"))
    body = {
      code: 200,
      data: {
        rows: submitted ? [summary()] : [],
        total: submitted ? 1 : 0,
        pageNum: 1,
        pageSize: 10,
      },
    };
  else if (path.endsWith("/knowledge/client/tasks/fixture-task"))
    body = {
      code: 200,
      data: {
        ...summary(),
        configSnapshot: submitted.config,
        stageMessage: completed
          ? "已核验整册成品"
          : "任务已入队，等待执行端领取",
        results: completed
          ? [
              {
                id: "fixture-result",
                submissionId: "fixture-sub",
                resultVersion: 1,
                state: "READY",
                summary: {
                  message: "通信界面契约验证，非实际制作",
                  questionCount: 200,
                },
                files: [
                  {
                    id: "student-file",
                    sheetId: "bundle",
                    copyIndex: 1,
                    role: "STUDENT",
                    fileName: "整册学生版.pdf",
                    contentType: "application/pdf",
                    size: 100,
                    sha256: "fixture",
                    available: true,
                  },
                  {
                    id: "answer-file",
                    sheetId: "bundle",
                    copyIndex: 1,
                    role: "ANSWER",
                    fileName: "整册教师版.pdf",
                    contentType: "application/pdf",
                    size: 100,
                    sha256: "fixture",
                    available: true,
                  },
                ],
              },
            ]
          : [],
      },
    };
  else if (path.endsWith("/files/student-file")) {
    assert.equal(
      route.request().headers().authorization,
      "Bearer ui-contract-token",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "%PDF-1.4\n% UI contract only\n%%EOF\n",
    });
    return;
  } else throw new Error(`Unexpected contract route: ${path}`);
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
});
try {
  await page.goto(`${base}/#/pages/login/index`);
  await page.locator('input[type="text"]').first().fill("fixture-user");
  await page.locator('input[type="password"]').fill("contract-only-password");
  await page.locator("uni-button").filter({ hasText: "登录" }).click();
  await page.getByText("任务工作台", { exact: true }).waitFor();
  assert.equal(await page.getByText("题库", { exact: true }).count(), 0);
  await page
    .locator("textarea")
    .first()
    .fill("整册20次练习，学生与教师两个版本");
  await page
    .locator("uni-button.mode-card")
    .filter({ hasText: "专项练习" })
    .click();
  await page.getByText("练习次数", { exact: true }).waitFor();
  await page.locator("uni-button").filter({ hasText: "发布任务" }).click();
  await page.getByText("任务已入队，等待执行端领取", { exact: true }).waitFor();
  assert.equal(submitted.config.modeOptions.copyCount, 20);
  assert.equal(submitted.config.modeOptions.questionsPerCopy, 10);
  assert.equal("referenceIds" in submitted.config, false);
  assert.equal(
    await page.getByText(/模拟接收|模拟处理完成|模拟审核/).count(),
    0,
  );
  await page.screenshot({
    path: `${output}/task-queued-390.png`,
    fullPage: true,
  });
  completed = true;
  await page.locator("uni-button").filter({ hasText: "刷新进度" }).click();
  await page.locator("uni-button").filter({ hasText: "查看结果" }).click();
  await page.getByText("下载整册学生版", { exact: true }).waitFor();
  assert.equal(
    await page.getByText("下载整册教师版", { exact: true }).count(),
    1,
  );
  assert.equal(await page.getByText(/第 1 份|共 20 份/).count(), 0);
  await page.screenshot({
    path: `${output}/whole-book-result-390.png`,
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page
    .locator("uni-button")
    .filter({ hasText: "下载整册学生版" })
    .click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "整册学生版.pdf");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    `${output}/summary.json`,
    JSON.stringify(
      {
        kind: "HTTP contract UI test with intercepted fixture responses; no real backend writes",
        width: 390,
        passed: true,
        assertions: [
          "real-login-ui",
          "four-mode-entry",
          "task-submit-config",
          "no-mobile-question-bank",
          "no-simulated-worker-controls",
          "queued-to-result-refresh",
          "two-whole-book-files",
          "authenticated-download",
        ],
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Real client UI contract checks passed (390px, intercepted HTTP fixtures; no real backend writes).",
  );
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  console.log("FAILURE BODY", await page.locator("body").innerText());
  console.log("ERRORS", errors);
  throw error;
} finally {
  await context.close();
  await browser.close();
}
