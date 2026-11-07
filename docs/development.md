# 页面与持续开发

2026-11-06 U20/U21：主入口接真实任务API；手机作为任务发布台，题库管理仍在原知识库后台。专项是多个练习合为一份成品，通常学生版和教师版各一个整册文件。此前Mock基线可从Git历史和父工作空间PRD证据追溯，不能继续作为当前入口说明。

运行、配置、认证和完整验证命令见[真实任务入口](real-tasks.md)。需求状态、实施范围、数据库和手机实测证据以父工作空间PRD-100为正本；本仓库不另造验收状态。

## 当前页面与职责

|页面|职责与主要组件|
|---|---|
|pages/login/index|真实账号密码、按后端提示显示验证码；KbButton|
|pages/index/index|要求输入、四类任务入口、最近真实任务|
|pages/configure/index|名称选填、独立模式配置、学科、分类模板、教师版、要求与附件；ClientPracticeOptions/ClientVariantOptions/ClientCollectionOptions、KbBottomAction|
|pages/records/index|服务端分页读取本人任务；真实total、翻页与错误状态|
|pages/record-detail/index|当前配置、状态/阶段说明、可见时轮询、结果入口；复制要求明确创建新任务|
|pages/result/index|读取后端结果及实际文件，整册学生/教师版鉴权下载；无模拟制作按钮|
|pages/templates/index|按任务/练习组合查询已发布适用模板，选用具体版本|
|pages/mine/index|真实身份、记录、模板、本机草稿及退出登录|
|pages/library/index、pages/resource-detail/index|兼容旧链接的说明页，无题目列表/详情数据，不进入主tab|
|其他历史路由|旧模拟发布、偏好/工具/组件演示与H5初始化回归；不作为当前真实任务流程验收入口|

仍有15个共享路由、2个H5历史回归路由；主tab为工作台/记录/我的三个。旧题库tab已移出。真实路由守卫使用client-tasks会话，业务权限最终由后端逐接口验证。

## 代码落点

- `core/client-task.ts`：四类型、纯校验、手机配置转换和结果DTO。它只表达传输层，不保存数据库凭据、Worker租约或题目批准。
- `stores/client-tasks.ts`：真实身份、当前配置、分页任务、详情、模板选项、异步提交及未知结果恢复。账号变化清空全部账号视图，再恢复当前owner缓存；旧请求不能写回新账号视图。
- `adapters/client`：实际HTTP、身份存取、资产上传和文件下载。H5 DOM仅用于条件编译包围的下载动作；标准App和小程序走各自文件API。
- `components/business/client`：专项、举一反三、错题收集的独立配置片段；共享基础组件仍在ui目录。不把不同模式的数量字段揉成一套比例。
- `core/skeleton.ts`、`core/workflow.ts`、`adapters/mock`：旧Mock兼容与测试工具；当前主页面不使用其演示身份和状态推进。

共享页面只组合组件和业务用例；网络/平台差异集中适配；ID保持字符串，不从展示名推导身份。业务列表由服务端分页，不沿用旧Mock数组过滤。教材/考点细项本轮没有继续使用fixture冒充真实数据，制作要求可直接说明范围。

## 配置、状态与文件

专项采用每次题量和练习次数，默认10题×20次；`copyCount/practiceCopies`是兼容字段名，含义为整册中的练习数量。举一反三采用每母题组合，默认1原题＋2变式＋1提升；附件识别前母题数未知，不以文件数替代。题目录入不强制排版/PDF，错题收集保留独立范围输入。任何模式入队都不代表真实出题、录入或文件完成。

提交前把本地文件上传为知识库资产，成功项保留assetId。上传键、任务操作键稳定；丢失上传回执且临时路径失效时先按原上传键查回资产。任务提交超时保留冻结请求，“查回本次提交”使用同一操作键和内容。冷启动自动恢复该owner待查回请求，不换新键重复建任务。

本机草稿与服务器任务明确区分。设备重开后本地临时路径失效，稳定assetId仍可复用；没有成功上传且无法查回的文件需重新选择。真实token使用独立认证存储，不进入任务配置、草稿或日志；退出请求服务端注销并清空当前身份/视图。

详情页仅可见时每4秒刷新，隐藏/卸载停止轮询。结果来自真实后端文件清单，手机不合成占位PDF当正式成品。整册学生版与教师版分别下载，教师版答案按制作规则红色。文件页数、大小、hash由真实文件元数据提供。

原Mock PDF已同步为整册，内部exerciseIndex只用于预览某次练习，不用于拆成20套文件。历史代码测试不具备数据库事务或真实执行证明。

## 开发验证

按AGENTS使用uniapp-development/frontend-development及父工程本轮实施授权。代码变更运行lint、类型检查、必要行为测试；共享代码运行H5/小程序/标准App构建和架构检查。浏览器当前主线使用`test:client-ui`，它明确拦截HTTP响应为契约替身；真实MySQL/执行端/手机证据由父工程记录，不能与替身测试混称。

`test:ui/test:skeleton/test:admin`保留旧Mock画面的历史脚本，主入口改为真实API后不再作为当前主线验收。依赖升级继续保持DCloud完整版本对齐和锁文件，不用force规避peer。修改业务接口同时更新父工程API登记与唯一契约。

三端编译分别输出`dist/build/h5`、`dist/build/mp-weixin`、`dist/build/app`。H5 index使用静态viewport适配手机；preview脚本必须指向H5目录，HTTP200和实际页面内容分别读回。App资源不是APK，原生权限/文件能力另验；App PDF选择当前明确待接入，图片选择使用uni.chooseImage。安卓包流程见[android-testing](android-testing.md)。
