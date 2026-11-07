# 手机真实任务入口

本轮入口为真实知识库登录和任务API，主导航为“工作台 / 记录 / 我的”。题库管理、选题和正式题目审批不进入手机页面。原Mock适配器及其单测保留为历史演示测试工具，主用户入口不再调用它。

## 运行

```sh
npm ci
npm run build:h5
VITE_API_PROXY_TARGET=http://127.0.0.1:18084 npm run preview:h5
```

H5产物是`dist/build/h5`，preview必须带此目录；仅端口监听不表示页面可取用。`preview:h5`已固定正确目录。需要隔离端口时追加`-- --port 5195`。启动前核对端口归属。LAN IP按当次网卡读回，不在源码固化。

H5默认调用同源`/api`，Vite server/preview代理到配置的业务后端。`VITE_API_PROXY_TARGET`是开发代理配置。标准App/小程序需要通过`VITE_API_BASE_URL`配置设备可访问的HTTP(S)业务API地址，并完成相应域名/权限及HTTPS配置；不要把电脑127.0.0.1当手机业务地址。所有VITE配置均是公开信息，不写凭据。

账号密码直接填登录页；页面读取`/captchaImage`处理是否需要验证码。会话使用独立认证存储键，token不进入任务配置、草稿或日志。退出先请求现有`/logout`并清理本机当前会话/视图；未确认提交保存在原账号命名空间，其他账号不能恢复原账号的提交。

## 当前协议与界面

- POST `/knowledge/client/tasks`提交冻结配置；GET同路径服务端分页，GET`/{id}`读取进度和结果。手机只传内容要求、配置和稳定附件身份，不含执行凭据或题目ID。
- 上传复用`POST /knowledge/asset/upload`，purpose为SOURCE_ORIGINAL，稳定上传键；已上传成功的附件重用assetId。临时文件失效要重新选择；本机草稿明确标为本机，不当作服务器任务。
- 模板读取`GET /knowledge/experience-versions/options?taskType=...&exerciseTypeCode=...`的准确适用组合。练习类当前STANDARD，录入为NONE。未分类旧模板不自动当作全部适用；不指定模板时由执行端按真实知识库规则处理。
- 专项配置为每次题量和练习次数，默认每次10题、20次。20次练习合成同一成品，通常是学生版/教师版两个整册文件；不是20份独立PDF或打印份数。`modeOptions.copyCount`为兼容传输字段名，界面使用“练习次数”。
- 举一反三保留每母题原题/变式/提升组合；错题收集有独立范围说明；题目录入不强制PDF。后台能力与质量门禁决定实际执行结果，入队不等于生成完成。
- 详情可见时每4秒刷新进度，离开页面停止轮询。结果从后端真实返回的文件列表取用，按任务/fileId鉴权下载，不从手机生成占位PDF冒充成品。
- 结果未知时保留当次操作键和完整冻结请求，“查回本次提交”原样重放；后续表单变化不会更改原请求。服务器明确拒绝后允许修改再提交。

当前“复制要求，发布新任务”是明确的新任务动作。过程反馈、同任务修订和成品到发布台完整编辑入口属于后续范围，不能把该复制动作声称为原任务修订。后台四类型执行器和题目/成品入库由对应实现与真实证据说明，页面没有模拟推进按钮。

## 验证

```sh
npm run lint
npm run type-check
npm test
npm run build:all
npm run test:architecture
CLIENT_UI_BASE=http://127.0.0.1:5195 npm run test:client-ui
```

`test:client-ui`是390px、HTTP响应替身的UI契约验证，不写真实后端；覆盖真实登录表单、任务提交形状、无手机题库/演示推进、进度到结果刷新、两整册文件与鉴权下载。证据默认进父工程`.runtime/work/prd100-web-real-20261106/ui-contract`，可用CLIENT_UI_OUTPUT指定。真实手机、MySQL和执行端回传证据由父工作空间PRD-100对应实施记录保存，不能用上述替身验证代替。

原`test:admin/test:skeleton/test:ui`脚本针对旧Mock画面，主入口改为真实API后不再作为当前主线验收脚本。旧领域单测保留用于兼容；Mock演示PDF亦已调整为整册，单次索引只用于内部预览。
