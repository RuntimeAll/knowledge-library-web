import test from "node:test";
import assert from "node:assert/strict";
import { freshDraft } from "../src/core/skeleton";
import { MockWorkflowAdapter } from "../src/adapters/mock/workflow";
import { buildDemoPdf, demoLines, unicodeHex } from "../src/core/demo-document";
test("mock files are valid PDF bytes bound to this snapshot; student output has no answer content", () => {
  const adapter = new MockWorkflowAdapter();
  adapter.login("admin");
  const spec = freshDraft();
  Object.assign(spec, {
    title: "两道母题的顺序检查",
    mode: "variant",
    referenceIds: ["preview-question-3", "preview-question-1"],
    goal: "按母题顺序叠加",
  });
  const receipt = adapter.submit(spec, { key: "pdf-case" });
  adapter.advance(receipt.workOrderId, receipt.submissionId, "receive");
  const result = adapter.advance(
    receipt.workOrderId,
    receipt.submissionId,
    "complete",
  ).result!;
  const student = Buffer.from(buildDemoPdf(spec, result, "student")).toString(
    "ascii",
  );
  const answer = Buffer.from(buildDemoPdf(spec, result, "answer")).toString(
    "ascii",
  );
  assert.ok(student.startsWith("%PDF-1.4"));
  assert.ok(student.endsWith("%%EOF\n"));
  assert.ok(student.includes(unicodeHex(spec.title)));
  assert.ok(student.includes("/Count 1"));
  assert.equal(
    demoLines(spec, result, "student").some((l) => l.red),
    false,
  );
  assert.equal(
    demoLines(spec, result, "answer").filter((l) => l.red).length,
    8,
  );
  assert.ok(answer.includes("0.827 0.184 0.184 rg"));
  assert.notEqual(student, answer);
});
