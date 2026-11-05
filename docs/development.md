# 页面骨架与持续开发

2026-11-05：初始化与页面骨架按用户授权联动修订，两张卡分别待用户验收。采用标准 uni-app Vue3，不是 uni-app x / nvue。数据为 `preview-*` 布局示例，未接入登录、真实题库、任务执行、文件上传或发布。

## 页面与组件

|页面|路由|主要复用组件|
|---|---|---|
|工作台|pages/index/index|KbPage、ModeSelector、AttachmentPicker、TaskCard|
|题库四分类|pages/library/index|KbSearch、KbChips、KbState；资源卡由本页拥有|
|制作记录|pages/records/index|KbSearch、KbChips、TaskCard、KbState|
|我的|pages/mine/index|KbPage、KbSection；个人信息与菜单由本页拥有|
|制作配置|pages/configure/index|SpecForm、ContextPicker、AttachmentPicker、KbBottomAction|
|记录详情、资料详情|pages/record-detail/index、pages/resource-detail/index|TaskCard、ResultFiles、KbState；时间线/摘要为页面局部结构|
|制作结果|pages/result/index|PaperPreview、ResultFiles|
|排版经验、版式预览|pages/templates/index、pages/template-preview/index|PaperPreview、KbBottomAction|
|发布准备|pages/publication/index|KbState、KbButton；正式文件缺失时禁用提交|
|教学工具、偏好|pages/tools/index、pages/settings/index|KbSection、KbChips、开关|
|开发组件预览|pages/ui/index|默认/加载/空/错、主次/禁用/加载按钮、长标题、弹层|
|初始化兼容回归，仅H5|pages/foundation/index、pages/about/index|旧基础表单、红色答案、原字节文件预览|

共14个共享路由（4个原生tab）与2个H5回归路由。组件预览不占教师主导航。页面只组装视图、读取草稿和处理路由；`core`定义配置/资源/记录模型及纯规则，`stores/draft`拥有内存配置，`fixtures`拥有隔离示例。未新增业务接口。

## 下一步开发方式

1. 从 `AGENTS.md` 进入 `uniapp-development` 与 `frontend-development` 技能，再查当前PRD门禁；03及以后未获本轮联动例外。
2. 新能力先在 `core`定义类型和端口；共享状态集中到对应store，页面不保存重复事实。真实分页由服务端提供，不沿用本轮fixture过滤作为生产分页。
3. 平台差异进 `adapters/platform`，H5原生DOM只进 `adapters/web`并条件编译。业务客户端保留HTTP成功与业务成功分离、注入会话和环境地址。
4. 新组件先在 `/pages/ui/index`补默认、禁用、加载、空、错和长内容；跨页面真实复用才提为业务组件，避免为了数量拆出只有名称的空组件。
5. 配置/返回逻辑改动运行核心测试和生产UI；依赖/共享组件改动运行三端编译。接口变更还需回现有工作空间登记API清单和契约。

## 平台能力与实测边界

|能力|H5|微信小程序|标准 App Vue|
|---|---|---|---|
|共享14路由和uview组件|生产浏览器交互验证|编译通过，未做开发者工具/真机验收|资源编译通过，未做基座/真机验收|
|图标|随包嵌入字体，离线可见|嵌入WXSS；待真机验证|字体随static/app-plus打包；待真机验证|
|图片选择|uni.chooseImage|uni.chooseImage，待权限/真机验证|uni.chooseImage，待权限/真机验证|
|PDF选择|uni.chooseFile；本机选择与移除验证|uni.chooseMessageFile，待真机验证|显式禁用，需另接原生文件选择能力|
|文件打开|图片预览、PDF独立窗口；旧H5回归页另测下载原字节|uni.openDocument，待真机验证|PDF选择能力未接，不能声称可完成全流程|
|安全区|360/390/430视口，固定操作区留白|预留状态栏/胶囊高度，真机待验|预留状态栏和底部safe-area，真机待验|

`tools/prepare-icons.mjs`从锁定的uview-plus包生成字体资产并保留MIT许可，所有开发/构建前自动运行，不依赖外部CDN。生成文件不入Git。升级组件库后重新生成、检查图标、弹层、字体和三端产物。

微信AppID、DCloud AppID、签名和打包账号未配置，不伪造真实身份。App编译结果不是apk/ipa安装包。无HBuilderX/微信开发者工具验证记录；平台兼容范围不可从H5截图外推。

## 本轮与v8的明确差异

- 单页配置保持所有字段，手机改用独立页面承载，教材选择仍使用底部弹层；返回保留草稿。
- 未接服务前主按钮为「保存配置」，不会生成虚假的成功任务；真实提交交给后续需求。
- 列表、状态、版式和关联内容为显式示例；无正式文件时不提供假下载。
- 工具/发布台只提供待接入说明，不读取其他本机业务数据或建立第二套发布事实。
- 题库四分类在同页切换；模板卡的三种视觉封面共享版式骨架，正式模板版本接入后再按真实模板渲染。

详尽PRD、授权、截图与验收正本仍在知识库工作空间 PRD-100-01-01/02。本仓库仅保存运行与维护说明。

## 本轮依赖审计

加入三端编译依赖后，2026-11-05 npm audit报告59个受影响依赖节点（10 low / 22 moderate / 27 high，0 critical）；不等于59个独立可利用漏洞。完整审计在工作空间本卡证据。官方编译链含旧版依赖，未用force升级破坏peer关系；公网发布前需完成兼容升级与安全复验。当前仅代码与本机预览交付。
