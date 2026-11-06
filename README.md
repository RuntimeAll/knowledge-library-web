# 知识库用户端

手机优先的 uni-app Vue3 + TypeScript + Pinia + uview-plus 用户端，目标为 Web、微信小程序、标准 App Vue。与现有管理端分开维护，后续复用同一知识库后端。

当前已有 15 个共享路由，包括单 admin 模拟登录、「工作台 / 题库 / 记录 / 我的」四个入口、制作配置、版本记录、结果与模拟文件、排版经验预览、发布草稿等。可用实际输入走通「配置 → 模拟提交 → 状态演练 → 结果确认 → 发布草稿」，操作保存在当前设备的模拟空间。题库、教材和模板仍为明确标注的示例；真实后端鉴权、文件上传、题目制作、录入与发布尚未接入。

## 本机预览

Node.js 24、npm 11（本轮24.22.1 / 11.19.1），按锁文件安装：

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:5193>，仅监听本机回环。现有管理端5173、后端8080继续独立运行。开发组件预览：<http://127.0.0.1:5193/#/pages/ui/index>。

点击「以 admin 进入演示」，无需真实密码。首页「想制作什么？」与配置页共用同一份要求，可选择专项练习、举一反三或只录题。资料名称为选填，留空可以保存或提交；记录、结果和下载使用类型与提交编号组成的展示名称，保留原始空名称。

专项练习独立设置「每份题目数量」和「一共制作多少份」，新配置默认 20 份：各份使用相同要求，目标是制作不同题目的练习。结果可按份切换，模拟 PDF 按当前份下载；尚未生成真实题面。历史配置缺少份数字段时继续按 1 份恢复，不自动改成 20 份。

举一反三保留每道母题的独立组合，按母题选择顺序逐组排列：默认原题 1 + 同类变式 2 + 提升拓展 1，选两道母题共 8 题，不套用专项份数配置。母题总数无需手填；仅题库选题时按所选母题计算，有附件时总题量待识别，模拟结果只展示已选题库母题的结构，不推断附件内题数。

每次提交冻结该版完整配置；从记录修改会追加新版本，旧版配置和结果继续可查。同一提交标识重试复用原记录，回执未知时先核对。确认模拟结果后可保存关联该结果的发布草稿；只录题仅提供模拟回执。演示 PDF 含配置、题组和占位内容，答案版占位用红色，学生版移除答案；不含真实题面。

会话、模拟记录、结果与发布草稿在本设备持久化；「保存草稿」或提交保存的配置可通过「用上次配置」恢复，未保存编辑仍只在当前会话。刷新后附件名称与顺序保留，平台临时文件须移除后重新选择。退出演示会清除会话和配置草稿，模拟记录保留供再次登录查看；「我的 → 重置演示记录」可清空本设备演示数据。

## 验证与三端构建

```bash
npm run lint
npm run type-check
npm test
npm run build:all
npm run test:architecture
npx playwright install chromium
npm run test:ui
npm run test:skeleton
npm run test:admin
```

`build:h5`输出`dist/build/h5`；`build:mp-weixin`输出`dist/build/mp-weixin`；`build:app`输出`dist/build/app`。开发命令分别是`dev:h5`、`dev:mp-weixin`、`dev:app`。图标资产在构建/启动前从锁定的依赖包自动生成，无外部CDN依赖。`tools/prepare-icons.mjs`仅生成本应用字体，`tools/check-boundaries.mjs`只读检查分层与产物。

Web 骨架测试覆盖 360/390/430/1280 宽度；`test:admin`使用独立浏览器上下文操作生产 H5，覆盖 390/650 宽度、三种制作方式、版本/异常恢复、会话及模拟文件下载。运行前先构建 H5。截图和报告在忽略提交的 `test-results`，也可用 `KB_UI_EVIDENCE_DIR` 指定目录；通过状态以本轮实际报告为准。

小程序与 App 的共享代码已进入编译验证范围；开发者工具、基座/真机与权限仍需独立验证。安卓环境与测试包准备见[安卓测试包](docs/android-testing.md)，安装、账号登录、AppID 与实际 APK 产出以该入口指向的本轮证据为准。App 资源构建不是 apk/ipa；App 任意 PDF 选择显式禁用，模拟结果文件取用也尚待适配。微信模拟文件保存/打开已有适配代码，未经设备验证。

## 维护入口

详见[页面与持续开发](docs/development.md)、[本仓库约定](AGENTS.md)。分层为 `pages` → `components/business` → `core`，通用组件在 `components/ui`。配置与纯规则在 `core/skeleton.ts`，任务/版本/结果/发布端口在 `core/workflow.ts`；页面通过 `stores/draft`、`stores/workflow` 访问状态，当前实现为 `adapters/mock`。平台差异在 `adapters/platform`，H5 专用能力在 `adapters/web`，示例数据单独放 `fixtures`。`npm run format`格式化源码。

`.env.example`说明 API 环境配置；不配置也能预览。`VITE_API_BASE_URL`供后续服务接入使用，设置它不会自动切换模拟流程；`VITE_WEB_BASE`控制 H5 静态资源前缀。所有 `VITE_*` 均为客户端公开信息，不填写凭据。正式鉴权、服务端分页、上传、任务调度与发布由后续真实适配器承接，模拟会话不能作为后端令牌。

[初始版本记录](docs/initialization.md)保留旧Web基线与依赖审计背景。官方DCloud编译链版本一致锁定，Vite5.2.8为其精确peer，不以强制升级跳过兼容检查。当前构建与页面验证不替代生产安全审查。

源码托管在[RuntimeAll/knowledge-library-web](https://github.com/RuntimeAll/knowledge-library-web)。PRD及用户验收正本留在现有知识库工作空间；本次没有部署GitHub Pages或公网服务。
