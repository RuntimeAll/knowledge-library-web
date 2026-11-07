import test from "node:test";
import assert from "node:assert/strict";
import {
  clientConfig,
  clientDraftError,
  draftFromConfig,
  newClientDraft,
} from "../src/core/client-task";

test("专项的20次练习保留在同一配置，不生成逐份文件或题库引用", () => {
  const draft = newClientDraft();
  draft.requirements = "整册有理数练习";
  const config = clientConfig(draft);
  assert.deepEqual(config.modeOptions, { questionsPerCopy: 10, copyCount: 20 });
  assert.equal(config.title, "");
  assert.equal("questionRefs" in config, false);
  assert.equal("referenceIds" in config, false);
  assert.equal("files" in config, false);
  assert.equal("variantCount" in config.modeOptions, false);
});
test("举一反三只提交每母题组合和有序持久附件", () => {
  const draft = newClientDraft();
  draft.mode = "VARIANT";
  draft.attachments = [
    {
      id: "local-a",
      path: "blob:private",
      name: "a.pdf",
      kind: "pdf",
      size: 20,
      assetId: "90071992547409931",
      uploadKey: "upload-a",
    },
  ];
  const config = clientConfig(draft);
  assert.deepEqual(config.modeOptions, {
    originalCount: 1,
    variantCount: 2,
    extensionCount: 1,
  });
  assert.deepEqual(config.attachments, [
    { assetId: "90071992547409931", order: 1, selectionNote: "" },
  ]);
  assert.equal(JSON.stringify(config).includes("blob:"), false);
  assert.equal("copyCount" in config.modeOptions, false);
});
test("录入使用NONE且不继承练习数量、排版或教师版要求", () => {
  const draft = newClientDraft();
  draft.mode = "INTAKE";
  draft.layoutVersionId = "old-layout";
  const config = clientConfig(draft);
  assert.equal(config.exerciseTypeCode, "NONE");
  assert.equal(config.includeAnswer, false);
  assert.deepEqual(config.templates, {});
  assert.deepEqual(config.modeOptions, {});
});
test("错题收集必须有原件，且不套用专项数量", () => {
  const draft = newClientDraft();
  draft.mode = "ERROR_COLLECTION";
  assert.match(clientDraftError(draft), /添加/);
  draft.attachments.push({
    id: "file",
    kind: "image",
    path: "image-path",
    name: "marked.jpg",
    size: 20,
    uploadKey: "upload",
  });
  assert.equal(clientDraftError(draft), "");
  assert.throws(() => clientConfig(draft), /上传/);
  draft.attachments[0].assetId = "asset";
  assert.deepEqual(clientConfig(draft).modeOptions, {});
});
test("复制真实任务保留稳定附件身份，不重用设备临时路径", () => {
  const draft = newClientDraft();
  draft.requirements = "复制要求";
  draft.attachments.push({
    id: "file",
    kind: "pdf",
    path: "private-path",
    name: "a.pdf",
    size: 20,
    assetId: "asset",
    uploadKey: "old-upload",
  });
  const copy = draftFromConfig(clientConfig(draft));
  assert.equal(copy.attachments[0].assetId, "asset");
  assert.equal(copy.attachments[0].path, "");
  assert.equal(clientDraftError(copy), "");
});
test("拒绝空专项目标、非整数练习次数和失效未上传附件", () => {
  const draft = newClientDraft();
  assert.match(clientDraftError(draft), /要求/);
  draft.requirements = "练习";
  draft.practice.copyCount = 1.5;
  assert.match(clientDraftError(draft), /整数/);
  draft.practice.copyCount = 20;
  draft.attachments.push({
    id: "file",
    kind: "pdf",
    path: "",
    name: "a",
    size: 20,
    uploadKey: "upload",
  });
  assert.match(clientDraftError(draft), /失效/);
});
