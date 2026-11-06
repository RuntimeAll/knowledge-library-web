# 页面骨架与持续开发

2026-11-05：初始化与页面骨架按用户授权联动修订，随后按本轮授权补齐原型输入/配置及单 admin 模拟全流程。2026-11-06 的 U16 修订将名称改为选填，专项练习增加独立份数配置，举一反三移除母题总数手填。采用标准 uni-app Vue3。用户验收与各子需求状态以工作空间 PRD 正本为准。

当前可以输入要求、选择本地参考资料或示例母题、保存配置、提交模拟任务、演练状态、查看历史版本和结果、下载模拟文件、确认结果并保存发布草稿。登录是单 admin 模拟会话，题库/教材/模板仍为 `preview-*` 示例；真实鉴权、上传、制作执行、题库写入和对外发布未接入。

## 页面与组件

|页面|路由|主要复用组件|
|---|---|---|
|模拟登录|pages/login/index|KbButton；仅 admin，无真实密码/令牌|
|工作台|pages/index/index|KbPage、AttachmentPicker、WorkflowRecordCard；要求输入由本页拥有|
|题库四分类|pages/library/index|KbSearch、KbChips、KbState；资源卡由本页拥有|
|制作记录|pages/records/index|KbSearch、KbChips、WorkflowRecordCard、KbState|
|我的|pages/mine/index|KbPage、KbSection；个人信息与菜单由本页拥有|
|制作配置|pages/configure/index|SpecForm、PracticeQuantity、VariantRecipe、ContextPicker、AttachmentPicker、KbBottomAction|
|记录详情|pages/record-detail/index|SubmissionSummary、WorkflowControls；版本选择与详情由本页拥有|
|资料详情|pages/resource-detail/index|ResultFiles、KbState；示例资源与参考题选择|
|制作结果|pages/result/index|SubmissionSummary、ResultFiles；题组预览、专项逐份切换、结果确认与模拟文件取用|
|排版经验、版式预览|pages/templates/index、pages/template-preview/index|PaperPreview、KbBottomAction|
|发布准备|pages/publication/index|KbState、KbButton；仅保存关联已确认模拟结果的草稿|
|教学工具、偏好|pages/tools/index、pages/settings/index|KbSection、KbChips、开关|
|开发组件预览|pages/ui/index|默认/加载/空/错、主次/禁用/加载按钮、长标题、弹层|
|初始化兼容回归，仅H5|pages/foundation/index、pages/about/index|旧基础表单、红色答案、原字节文件预览|

共 15 个共享路由（4 个原生 tab）与 2 个 H5 回归路由。组件预览不占教师主导航。路由守卫在 `adapters/platform/auth.ts`，除登录及历史 H5 回归页外需要有效模拟会话。界面守卫只服务演练，不能替代后端权限校验。

## 配置、版本与持久化

首页输入和配置页的补充要求共用 `DraftSpec.goal`。配置按名称、专项题量与份数/母题组合、学科→教材→章节→多考点、难度、模板版本、答案、补充要求排列；改变上游清空下游选择。资料名称为选填，空名称可保存和提交；`displayTitle` 为记录、结果、下载与发布草稿初始展示提供类型及稳定提交编号组成的兜底名称，不回写或修改提交快照的原始 `title`。只录题保留名称、教材上下文、要求与适用的处理范围。有附件才显示处理范围。

专项练习由 `PracticeQuantity` 独立维护每份题量 `count` 和制作份数 `practiceCopies`，两者均允许 1–100 的整数，新配置默认每份 10 题、共 20 份。各份使用同一份冻结要求，目标为不同题目的练习，不表示同内容的打印份数。结果保存每份的 `copyIndex`，份内题号独立；界面逐份切换，`ResultFiles` 只预览和下载当前份，文件名与正文带第 N 份标识。Mock 只生成分份结构和题面占位，不能将其描述为已经生成不同真实题目。历史草稿或快照缺少 `practiceCopies` 时按 1 份解释；既有配置和结果不因新默认值变为 20 份。

举一反三使用每母题组合（PER_SOURCE）：按照母题选择顺序，每组依次放原题、同类变式、提升拓展，再进入下一道母题。默认 `1 + 2 + 1`，两道母题共 8 题；每类允许 0–20，每组总数 1–50。母题总数不再手填；仅从题库选题时按已选参考题计数，有附件时总题量保持 `null`，待真实识别/制作服务确定。模拟结果仅保留已选题库母题的顺序与组合，不以文件数推断题数，也不为附件补造母题身份。旧 `sourceQuestionCount` 字段仅保留读取兼容，不参与计数。专项与举一反三保留各自配置职责，举一反三不显示专项份数，未新增页数字段。

`core/skeleton.ts`定义配置/资源及纯校验；`core/workflow.ts`定义任务、提交版本、模拟结果、发布草稿与 `WorkflowPort`。页面只调用 `stores/workflow.ts`，当前端口实现为 `adapters/mock/workflow.ts`，后续通过 `configureWorkflowPort` 注入真实适配器。Mock 的记录查询虽提供分页形状，真实接入仍必须由服务端分页。未新增服务端业务接口。

每次提交复制并冻结完整配置快照。首次创建独立任务，从记录修改则在同一任务追加版本，旧配置和旧结果保留；旧版回调不能把当前版本切回去。相同提交标识与输入复用原回执，变更输入复用同标识会报冲突，修改版本要核对 `baseRevision`。回执未知先用原标识核对，不重复新建。

状态演练包括等待、处理中、失败重试、离线恢复、待补材料、待审核和提交结果待核对。只有状态允许的演练动作可执行。完成结果关联具体提交版本；确认后可保存发布草稿，草稿按任务复用身份并关联选定的结果 ID，状态始终为 `draft`。只录题生成 JSON 回执，不生成可发布成品。

|本地状态|存储与恢复行为|
|---|---|
|模拟会话、任务/所有提交版本、结果、发布草稿|`knowledge-library:admin-preview:workflow:v1`，通过 uni storage 持久化；默认模拟会话有效期 8 小时|
|保存或提交过的配置|`knowledge-library-demo-draft-v1`；「用上次配置」读取，未保存的编辑不自动持久化|
|附件|保存名称、大小、类型及顺序等元数据；应用重新加载后临时路径不可用，显示「需重新选择」，重新提交前移除并补选|
|退出与重置|退出清会话和配置草稿，保留模拟记录供再次登录；「我的 → 重置演示记录」经页面确认后仅清本设备模拟记录/发布草稿和配置|

这些存储不是正式业务数据源。真实适配器需独立实现账号权限、上传资产引用、服务端幂等/版本、任务状态回读及发布契约，不接受 Mock 身份或 `preview-*` 资源作为正式凭证。

Mock 读写和导航前会同步其他标签的缓存变更：另一标签退出后，旧页面的后续导航、提交与草稿保存会被拒绝，不能恢复旧会话。已验证顺序交错操作；本地存储没有事务锁，不代表支持多个标签同时原子提交。

## 下一步开发方式

1. 从 `AGENTS.md` 进入 `uniapp-development` 与 `frontend-development` 技能，再查当前 PRD 门禁及本轮授权范围；本轮已获单 admin 模拟流程实施授权，后续真实接口和其他子需求按各自门禁推进。
2. 新能力先在 `core`定义类型和端口；共享状态集中到对应store，页面不保存重复事实。真实分页由服务端提供，不沿用本轮fixture过滤作为生产分页。
3. 平台差异进 `adapters/platform`，H5原生DOM只进 `adapters/web`并条件编译。业务客户端保留HTTP成功与业务成功分离、注入会话和环境地址。
4. 新组件先在 `/pages/ui/index`补默认、禁用、加载、空、错和长内容；跨页面真实复用才提为业务组件，避免为了数量拆出只有名称的空组件。
5. 配置/返回/版本逻辑改动运行核心测试、`test:skeleton` 与 `test:admin`；共享代码按本仓库约定运行 lint、类型检查、核心测试和三端编译。接口变更还需回现有工作空间登记 API 清单和契约。

## 平台能力与实测边界

|能力|H5|微信小程序|标准 App Vue|
|---|---|---|---|
|共享15路由和uview组件|生产浏览器测试入口覆盖共享页面及 admin 流程|编译验证范围，未做开发者工具/真机验收|资源编译验证范围，未做基座/真机验收|
|图标|随包嵌入字体，离线可见|嵌入WXSS；待真机验证|字体随static/app-plus打包；待真机验证|
|图片选择|uni.chooseImage|uni.chooseImage，待权限/真机验证|uni.chooseImage，待权限/真机验证|
|PDF选择|uni.chooseFile；本机选择与移除验证|uni.chooseMessageFile，待真机验证|显式禁用，需另接原生文件选择能力|
|文件打开|图片预览、PDF独立窗口；旧H5回归页另测下载原字节|uni.openDocument，待真机验证|PDF选择能力未接，不能声称可完成全流程|
|模拟结果文件|通过 Blob 下载模拟 PDF / 录题 JSON|写入 USER_DATA_PATH，PDF 调用 openDocument；待设备验证|未接文件取用，明确提示使用 Web 核对|
|安全区|360/390/430视口，固定操作区留白|预留状态栏/胶囊高度，真机待验|预留状态栏和底部safe-area，真机待验|

`tools/prepare-icons.mjs`从锁定的uview-plus包生成字体资产并保留MIT许可，所有开发/构建前自动运行，不依赖外部CDN。生成文件不入Git。升级组件库后重新生成、检查图标、弹层、字体和三端产物。

安卓环境、测试身份和隔离资源准备见[安卓测试包](android-testing.md)。HBuilderX 安装、账号登录、真实 AppID、签名及 APK 产出状态以该入口指向的本轮工作空间证据为准；资源编译不等于 apk/ipa 安装包。微信开发者工具与设备验证仍需独立记录，平台兼容范围不可从 H5 截图外推。

## 原型对齐与模拟边界

- 首页提供带标签的多行输入、已选资料、上传/题库/专项入口及独立的举一反三、只录题入口。完整配置在一个独立页面，返回保留当前编辑；题量和教材选择使用弹层。
- 主操作「提交模拟任务」执行显式 Mock，记录来源为本次实际输入；状态靠演练控件推进，不代表后台 Worker 已运行。草稿保存与提交快照分别处理。
- 题库四分类和模板仍为示例。模板标注「示例 v1」，学生/答案预览切换时学生节点中移除答案，答案占位为红色；正式模板版本接入后再按真实模板渲染。
- `core/demo-document.ts`生成可下载的模拟 PDF，仅包含配置、题组顺序及题面/答案占位；专项按当前份输出并注明份序，附件未识别时不补造总题量。答案版默认红色，关闭答案后不产生答案文件。只录题下载 JSON，明确标记未写入正式题库。
- 发布页保存本设备模拟发布草稿，不对外发布；教学工具入口仍为待接入说明，不读取其他本机业务数据。

详尽 PRD、授权、截图与验收正本仍在知识库工作空间 PRD-100-01-01/02/03。本仓库仅保存运行与维护说明，`docs/initialization.md`保留历史初始化记录，不代表当前状态。

## 验证入口

先运行 `npm run lint`、`npm run type-check`、`npm test`、`npm run build:all`、`npm run test:architecture`，再安装 Chromium 并运行 `test:ui`、`test:skeleton`、`test:admin`。后者读取 `dist/build/h5`，须在源码变更后重新构建。

`test:ui`维护历史初始化回归（其中“刷新清空”只针对旧基础表单）；`test:skeleton`覆盖 360/390/430/1280 宽度的共享骨架、空名称保存与专项默认 20 份；`test:admin`以独立浏览器上下文覆盖 390/650 宽度及实际输入、空名称提交、专项 20 份结果与第 1/2 份下载、母题选择顺序、版本冻结、异常恢复、结果/发布草稿、会话退出。核心测试另覆盖旧单份配置恢复和附件题量未知。测试不向真实后端发请求。

默认报告和截图在忽略提交的 `test-results`，可用 `KB_UI_EVIDENCE_DIR`指定本轮证据目录。测试存在不等于本轮通过，以实际运行输出与 PRD 验收记录为准；编译、浏览器测试、设备验证和用户验收分别记录。

## 本轮依赖审计

加入三端编译依赖后，2026-11-05 npm audit报告59个受影响依赖节点（10 low / 22 moderate / 27 high，0 critical）；不等于59个独立可利用漏洞。完整审计在工作空间本卡证据。官方编译链含旧版依赖，未用force升级破坏peer关系；公网发布前需完成兼容升级与安全复验。当前仅代码与本机预览交付。
