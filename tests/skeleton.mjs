import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve("dist/build/h5");
const out = path.resolve(process.env.KB_UI_EVIDENCE_DIR || "test-results");
await mkdir(out, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".pdf": "application/pdf",
  ".png": "image/png",
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
    if (!file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      })
      .end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });

const report = [];
const button = (page, text) =>
  page.locator("uni-button:visible").filter({ hasText: text });
const titleInput = (page) =>
  page.locator('[data-testid="draft-title"] input:visible');
const homeGoal = (page) => page.locator(".goal-field textarea:visible");
const back = (page) => page.locator(".kb-back:visible").click();
async function pickFiles(page, label, files) {
  await button(page, "上传资料").click();
  await expect(page.locator(".upload-sheet:visible")).toBeVisible();
  const choosing = page.waitForEvent("filechooser");
  await button(page, label).click();
  const chooser = await choosing;
  assert.equal(chooser.isMultiple(), true, `${label}: multiple selection`);
  await chooser.setFiles(files);
  await expect(page.locator(".upload-sheet:visible")).toHaveCount(0);
  await expect(page.locator(".attachment-item:visible")).toHaveCount(
    files.length,
  );
  await noOverflow(page);
}
async function visiblePage(page, title) {
  await expect(page.locator(".kb-title:visible").last()).toHaveText(title);
}
async function noOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "no horizontal overflow",
  );
}
async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator("uni-toast:visible, .uni-toast:visible"),
  ).toHaveCount(0);
  assert.equal(
    await page.evaluate(() => document.fonts.check("16px uicon-iconfont")),
    true,
    "local icon font loaded",
  );
  await noOverflow(page);
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    fullPage: true,
  });
}
try {
  for (const width of [360, 390, 430, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (request) => {
      if (
        /^https?:/.test(request.url()) &&
        new URL(request.url()).origin !== new URL(url).origin
      )
        errors.push("Unexpected external request: " + request.url());
    });
    page.on("console", (m) => {
      if (
        m.type() === "error" ||
        m.text().includes("Failed to resolve component")
      )
        errors.push(m.text());
    });
    await page.goto(url);
    await expect(page.locator(".login-title:visible")).toHaveText("欢迎回来");
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await shot(page, `skeleton-login-${width}`);
    await button(page, "以 admin 进入演示").click();
    await visiblePage(page, "工作台");
    await expect(page.locator("uni-tabbar")).toBeVisible();
    await expect(page.locator(".uni-tabbar__item")).toHaveCount(4);
    await expect(homeGoal(page)).toBeVisible();
    const goalBox = await homeGoal(page).boundingBox();
    assert.ok(
      goalBox && goalBox.height >= 90,
      "home textarea has visible writing space",
    );
    await expect(page.locator(".goal-field:visible")).toHaveCSS(
      "border-top-width",
      "1px",
    );
    const initialGoal = "题目由易到难，保留原题，留足书写空间。";
    const editedGoal = "题目由易到难，保留原题，每题留出三行书写空间。";
    await homeGoal(page).fill(initialGoal);
    await expect(page.locator(".input-count:visible")).toHaveText(
      `${initialGoal.length}/300`,
    );
    await expect(
      page.getByText("从这一次制作开始", { exact: true }),
    ).toBeVisible();
    await shot(page, `skeleton-home-${width}`);
    const pdfBytes = await readFile("src/static/preview-sample.pdf");
    const longName = "名称很长的第二份课堂参考资料用于检查手机端省略显示.pdf";
    await pickFiles(page, "选择 PDF", [
      {
        name: "preview-sample.pdf",
        mimeType: "application/pdf",
        buffer: pdfBytes,
      },
      {
        name: longName,
        mimeType: "application/pdf",
        buffer: pdfBytes,
      },
    ]);
    await expect(page.locator(".attachment-file:visible")).toHaveText([
      /1\. preview-sample\.pdf/,
      new RegExp(`2\\. ${longName}`),
    ]);
    await shot(page, `skeleton-pdf-selection-${width}`);
    await button(page, "移除").first().click();
    await expect(page.locator(".attachment-file:visible")).toHaveText(
      new RegExp(`1\\. ${longName}`),
    );
    await button(page, "移除").first().click();
    await expect(page.locator(".attachment-item:visible")).toHaveCount(0);
    const pngBytes = await readFile("src/static/tabs/index-active.png");
    await pickFiles(page, "选择图片", [
      { name: "第一张参考图.png", mimeType: "image/png", buffer: pngBytes },
      { name: "第二张参考图.png", mimeType: "image/png", buffer: pngBytes },
    ]);
    await expect(page.locator(".attachment-file:visible")).toHaveText([
      /1\. 图片 1/,
      /2\. 图片 2/,
    ]);
    await button(page, "移除").first().click();
    await expect(page.locator(".attachment-file:visible")).toHaveText(
      /1\. 图片 2/,
    );
    await button(page, "移除").first().click();
    await expect(page.locator(".attachment-item:visible")).toHaveCount(0);
    await button(page, "专项练习").click();
    await visiblePage(page, "专项练习");
    await button(page, "提交模拟任务").click();
    await expect(
      page.getByText("先给这份资料起个名字", { exact: true }),
    ).toBeVisible();
    const title = "七年级数学 · 本次课堂练习";
    await titleInput(page).fill(title);
    await page
      .locator(".collapse-heading:visible")
      .filter({ hasText: "补充要求" })
      .click();
    const requirements = page.locator(
      '[data-testid="draft-requirements"] textarea:visible',
    );
    await expect(requirements).toHaveValue(initialGoal);
    // uni textarea applies its cursor on focus; select after focus settles.
    await requirements.click();
    await requirements.press("ControlOrMeta+A");
    await requirements.press("Backspace");
    await expect(requirements).toHaveValue("");
    await requirements.fill(editedGoal);
    await expect(requirements).toHaveValue(editedGoal);
    await page.locator(".context-entry:visible").click();
    await expect(page.locator(".picker-sheet:visible")).toBeVisible();
    await button(page, "人教版 · 七年级上册").click();
    await button(page, "第一章 · 有理数").click();
    await button(page, "有理数运算").click();
    await button(page, "正负数的意义").click();
    await expect(page.locator(".point-options .selected:visible")).toHaveCount(
      2,
    );
    await button(page, "确认选择").click();
    await expect(page.locator(".picker-sheet:visible")).toHaveCount(0);
    await expect(page.locator(".context-value:visible")).toHaveText(
      "数学 · 人教版七上 · 有理数 · 有理数运算、正负数的意义",
    );
    await page.locator(".template-entry:visible").click();
    await visiblePage(page, "排版经验");
    await page.locator(".template-card:visible").nth(1).click();
    await visiblePage(page, "图文学习卡");
    await expect(
      page.locator('[data-testid="paper-answer"]:visible'),
    ).toHaveCount(0);
    await button(page, "答案版").click();
    await expect(
      page.locator('[data-testid="paper-answer"]:visible'),
    ).toHaveCount(5);
    await expect(
      page.locator('[data-testid="paper-answer"]:visible').first(),
    ).toHaveCSS("color", "rgb(211, 47, 47)");
    await shot(page, `skeleton-template-answer-${width}`);
    await button(page, "学生版").click();
    await expect(
      page.locator('[data-testid="paper-answer"]:visible'),
    ).toHaveCount(0);
    await button(page, "使用这个版式").click();
    await visiblePage(page, "专项练习");
    await expect(titleInput(page)).toHaveValue(title);
    await expect(page.locator(".template-copy:visible")).toContainText(
      "图文学习卡",
    );
    await expect(page.locator(".template-copy:visible")).toContainText(
      "示例 v1",
    );
    await button(page, "保存草稿").click();
    await expect(button(page, "用上次配置")).toBeVisible();
    await titleInput(page).fill("临时调整，恢复时应回到已保存名称");
    await button(page, "用上次配置").click();
    await expect(titleInput(page)).toHaveValue(title);
    await expect(requirements).toHaveValue(editedGoal);
    await shot(page, `skeleton-configure-${width}`);
    await back(page);
    await visiblePage(page, "工作台");
    await expect(homeGoal(page)).toHaveValue(editedGoal);
    await button(page, "举一反三").click();
    await visiblePage(page, "举一反三");
    await expect(page.locator(".recipe-section:visible")).toBeVisible();
    await expect(
      page.locator('[data-testid="recipe-total"]:visible'),
    ).toContainText("母题数量待核对");
    await button(page, "调整").click();
    await expect(page.locator(".recipe-sheet:visible")).toBeVisible();
    await button(page, "确认组合").click();
    await back(page);
    await visiblePage(page, "工作台");
    await button(page, "只录题").click();
    await visiblePage(page, "只录题");
    await expect(page.locator(".template-entry:visible")).toHaveCount(0);
    await expect(page.locator(".recipe-section:visible")).toHaveCount(0);
    await back(page);
    await visiblePage(page, "工作台");
    await page.locator(".uni-tabbar__item").filter({ hasText: "题库" }).click();
    await visiblePage(page, "题库");
    for (const name of ["大纲", "考点", "成品课件", "题目"]) {
      await button(page, name).first().click();
      await expect(page.locator(".resource-card:visible")).toHaveCount(
        name === "题目" ? 3 : 2,
      );
    }
    await page.locator(".search-input input").fill("没有匹配的内容");
    await expect(page.getByText("暂无匹配内容", { exact: true })).toBeVisible();
    await page.locator(".search-input input").fill("");
    await expect(page.locator(".resource-card:visible")).toHaveCount(3);
    await page.locator(".resource-title:visible").first().click();
    await visiblePage(page, "资料详情");
    await back(page);
    await visiblePage(page, "题库");
    await shot(page, `skeleton-library-${width}`);
    await page.locator(".uni-tabbar__item").filter({ hasText: "记录" }).click();
    await visiblePage(page, "制作记录");
    await expect(
      page.getByText("还没有制作记录", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".task-card:visible")).toHaveCount(0);
    await shot(page, `skeleton-records-${width}`);
    await button(page, "待处理").first().click();
    await expect(page.getByText("暂无匹配记录", { exact: true })).toBeVisible();
    await expect(page.locator(".task-card:visible")).toHaveCount(0);
    await button(page, "已完成").first().click();
    await expect(page.getByText("暂无匹配记录", { exact: true })).toBeVisible();
    await expect(page.locator(".task-card:visible")).toHaveCount(0);
    await button(page, "全部").first().click();
    await page.locator(".search-input input").fill("没有匹配记录");
    await expect(page.getByText("暂无匹配记录", { exact: true })).toBeVisible();
    await expect(page.locator(".task-card:visible")).toHaveCount(0);
    await page.locator(".search-input input").fill("");
    await expect(
      page.getByText("还没有制作记录", { exact: true }),
    ).toBeVisible();
    await page.locator(".uni-tabbar__item").filter({ hasText: "我的" }).click();
    await visiblePage(page, "我的");
    await expect(page.locator(".profile-title:visible")).toHaveText("admin");
    await expect(page.locator(".stat-number:visible")).toHaveText([
      "0",
      "0",
      "0",
    ]);
    await shot(page, `skeleton-mine-${width}`);
    await page.getByText("教学工具", { exact: true }).click();
    await visiblePage(page, "教学工具");
    await expect(page.locator(".tool-card")).toHaveCount(3);
    await back(page);
    await page.getByText("偏好设置", { exact: true }).click();
    await visiblePage(page, "偏好设置");
    await expect(
      page.getByText("答案默认红色，学生版不含答案", { exact: true }),
    ).toBeVisible();
    await page.goto(`${url}#/pages/ui/index`);
    await visiblePage(page, "组件预览");
    await button(page, "加载").first().click();
    await expect(page.getByText("正在加载", { exact: true })).toBeVisible();
    await button(page, "错误").first().click();
    await expect(page.getByText("暂时没能加载", { exact: true })).toBeVisible();
    await button(page, "重新加载").click();
    await expect(
      page.getByText("内容已就绪 · 默认状态", { exact: true }),
    ).toBeVisible();
    await button(page, "主要操作").click();
    await expect(page.getByText("确认信息", { exact: true })).toBeVisible();
    await page.locator(".u-modal").getByText("取消", { exact: true }).click();
    await expect(button(page, "不可用操作")).toHaveClass(/u-button--disabled/);
    await button(page, "空态").first().click();
    await expect(
      page.getByText("这里还没有内容", { exact: true }),
    ).toBeVisible();
    await shot(page, `skeleton-components-${width}`);
    assert.deepEqual(errors, [], "browser errors and unresolved components");
    report.push({
      width,
      result: "passed",
      checks: [
        "single admin login through UI and four tabs",
        "visible home textarea and bidirectional requirements sync",
        "local fonts without external requests",
        "multiple PDF selection, long names and removal",
        "multiple image selection, order and removal",
        "title validation",
        "textbook chapter and multiple points",
        "student/answer template preview, red answers and return",
        "save and restore draft",
        "three modes",
        "four library categories",
        "empty search",
        "resource detail navigation",
        "real empty records, search and status filters without seeded tasks",
        "tools and settings",
        "loading empty error disabled modal",
        "no horizontal overflow",
        "no console errors",
      ],
    });
    await context.close();
  }
  await writeFile(
    path.join(out, "skeleton-report.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        target: "production H5 Chromium, viewport simulation only",
        report,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
