import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
for (const file of await walk("src/core")) {
  assert.doesNotMatch(
    await readFile(file, "utf8"),
    /\b(?:document|window|uni)\s*\.|from\s+['"](?:vue|pinia|@dcloudio)/,
    `${file}: core must remain platform independent`,
  );
}
for (const dir of ["src/pages", "src/components"]) {
  for (const file of await walk(dir)) {
    if (file.includes("/foundation/") || file.includes("/about/")) continue;
    assert.doesNotMatch(
      await readFile(file, "utf8"),
      /\b(?:document|window|localStorage)\s*\.|<(?:iframe|div|span|section)\b|adapters\/web\//,
      `${file}: shared UI cannot depend on H5 DOM`,
    );
  }
}
const pkg = JSON.parse(await readFile("package.json", "utf8"));
for (const target of [
  "@dcloudio/uni-app-plus",
  "@dcloudio/uni-h5",
  "@dcloudio/uni-mp-weixin",
])
  assert.equal(pkg.dependencies[target], pkg.dependencies["@dcloudio/uni-app"]);
const mp = JSON.parse(await readFile("dist/build/mp-weixin/app.json", "utf8"));
assert.equal(mp.pages.length, 15);
assert.equal(mp.tabBar.list.length, 3);
assert.ok(
  mp.pages.every((p) => !p.includes("foundation") && !p.includes("about")),
);
for (const file of ["dist/build/mp-weixin/app.wxss", "dist/build/app/app.css"])
  assert.ok(
    (await readFile(file, "utf8")).includes("uicon-iconfont"),
    `${file}: packaged icon font`,
  );
console.log(
  "Shared core/UI boundaries, aligned compiler versions, 15 mini-program routes, 3 task tabs, and packaged fonts: passed.",
);
