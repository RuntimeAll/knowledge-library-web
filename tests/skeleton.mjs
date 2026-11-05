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
  page.locator("uni-button").filter({ hasText: text });
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
    await visiblePage(page, "工作台");
    await expect(page.locator("uni-tabbar")).toBeVisible();
    await shot(page, `skeleton-home-${width}`);
    const choosing = page.waitForEvent("filechooser");
    await button(page, "PDF").click();
    const pdfBytes = await readFile("src/static/preview-sample.pdf");
    await (
      await choosing
    ).setFiles([
      {
        name: "preview-sample.pdf",
        mimeType: "application/pdf",
        buffer: pdfBytes,
      },
      {
        name: "名称很长的第二份课堂参考资料用于检查手机端省略显示.pdf",
        mimeType: "application/pdf",
        buffer: pdfBytes,
      },
    ]);
    await expect(page.locator(".attachment-item")).toHaveCount(2);
    await noOverflow(page);
    await button(page, "移除").first().click();
    await button(page, "移除").first().click();
    await expect(page.locator(".attachment-item")).toHaveCount(0);
    await button(page, "开始配置").click();
    await visiblePage(page, "专项练习");
    await button(page, "保存配置").click();
    await expect(
      page.getByText("先给这份资料起个名字", { exact: true }),
    ).toBeVisible();
    await page
      .locator('[data-testid="draft-title"] input')
      .fill("七年级数学 · 本次课堂练习");
    await page.locator(".context-entry").click();
    await expect(page.locator(".picker-sheet")).toBeVisible();
    await button(page, "人教版 · 七年级上册").click();
    await button(page, "有理数运算").click();
    await button(page, "确认选择").click();
    await expect(page.locator(".picker-sheet")).toBeHidden();
    await expect(page.locator(".context-value")).toContainText("人教版七上");
    await page.locator(".template-entry").click();
    await visiblePage(page, "排版经验");
    await page.locator(".template-card").nth(1).click();
    await visiblePage(page, "图文学习卡");
    await button(page, "使用这个版式").click();
    await visiblePage(page, "专项练习");
    await expect(page.locator('[data-testid="draft-title"] input')).toHaveValue(
      "七年级数学 · 本次课堂练习",
    );
    await expect(page.locator(".template-copy")).toContainText("图文学习卡");
    await button(page, "保存配置").click();
    await expect(button(page, "复用上次配置")).toBeVisible();
    await shot(page, `skeleton-configure-${width}`);
    await button(page, "举一反三").click();
    await expect(page.getByText("题目组合", { exact: true })).toBeVisible();
    await button(page, "只录题").click();
    await expect(page.locator(".template-entry")).toHaveCount(0);
    await button(page, "专项练习").click();
    await page.locator(".kb-back").click();
    await visiblePage(page, "工作台");
    await page.locator(".uni-tabbar__item").filter({ hasText: "题库" }).click();
    await visiblePage(page, "题库");
    for (const name of ["大纲", "考点", "成品课件", "题目"]) {
      await button(page, name).first().click();
      await expect(page.locator(".resource-card")).toHaveCount(2);
    }
    await page.locator(".search-input input").fill("没有匹配的内容");
    await expect(page.getByText("暂无匹配内容", { exact: true })).toBeVisible();
    await page.locator(".search-input input").fill("");
    await button(page, "选作参考").first().click();
    await expect(
      page.getByText("已选 1 道参考题", { exact: true }),
    ).toBeVisible();
    await page.locator(".resource-title").first().click();
    await visiblePage(page, "资料详情");
    await button(page, "作为参考，去配置").click();
    await visiblePage(page, "专项练习");
    await expect(page.locator('[data-testid="draft-title"] input')).toHaveValue(
      "七年级数学 · 本次课堂练习",
    );
    await page.locator(".kb-back").click();
    await page.locator(".kb-back").click();
    await visiblePage(page, "题库");
    await shot(page, `skeleton-library-${width}`);
    await page.locator(".uni-tabbar__item").filter({ hasText: "记录" }).click();
    await visiblePage(page, "制作记录");
    await shot(page, `skeleton-records-${width}`);
    await button(page, "待处理").first().click();
    await expect(page.locator(".task-card")).toHaveCount(3);
    await button(page, "已完成").first().click();
    await expect(page.locator(".task-card")).toHaveCount(1);
    await button(page, "全部").first().click();
    await page.locator(".search-input input").fill("没有匹配记录");
    await expect(page.locator(".task-card")).toHaveCount(0);
    await page.locator(".search-input input").fill("");
    await expect(page.locator(".task-card")).toHaveCount(4);

    await page.locator(".task-card").first().click();
    await visiblePage(page, "记录详情");
    await button(page, "查看结果").click();
    await visiblePage(page, "制作结果");
    await button(page, "发布准备").click();
    await visiblePage(page, "发布准备");
    await expect(button(page, "提交发布")).toHaveClass(/u-button--disabled/);
    await page.goto(`${url}#/pages/mine/index`);
    await visiblePage(page, "我的");
    await shot(page, `skeleton-mine-${width}`);
    await page.getByText("教学工具", { exact: true }).click();
    await visiblePage(page, "教学工具");
    await expect(page.locator(".tool-card")).toHaveCount(3);
    await page.locator(".kb-back").click();
    await page.getByText("偏好设置", { exact: true }).click();
    await visiblePage(page, "偏好设置");
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
    await button(page, "空态").first().click();
    await shot(page, `skeleton-components-${width}`);
    assert.deepEqual(errors, [], "browser errors and unresolved components");
    report.push({
      width,
      result: "passed",
      checks: [
        "four tabs",
        "local fonts without external requests",
        "multiple PDF selection, long names and removal",
        "title validation",
        "context popup",
        "template select and return",
        "draft retention",
        "three modes",
        "four library categories",
        "empty search",
        "reference selection",
        "record search and status filters",
        "record result publication",
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
