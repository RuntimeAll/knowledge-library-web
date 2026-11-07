import { displayTitle, modeLabels, type DraftSpec } from "./skeleton";
import type { MockResult, ResultArtifact } from "./workflow";
export function unicodeHex(value: string): string {
  return Array.from({ length: value.length }, (_, i) =>
    value.charCodeAt(i).toString(16).padStart(4, "0"),
  ).join("");
}
interface Line {
  text: string;
  red?: boolean;
  large?: boolean;
}
const labels = {
  original: "原题",
  variant: "同类变式",
  extension: "提升拓展",
  practice: "专项练习",
};
export function demoLines(
  spec: DraftSpec,
  result: MockResult,
  kind: ResultArtifact,
  copyIndex?: number,
): Line[] {
  if (!result.artifacts.includes(kind)) throw new Error("这版结果没有该文件");
  const copies = result.practiceCopies ?? 1;
  if (
    result.mode === "practice" &&
    copyIndex !== undefined &&
    (!Number.isInteger(copyIndex) || copyIndex < 1 || copyIndex > copies)
  )
    throw new Error("没有这次专项练习");
  const lines: Line[] = [
    {
      text: `${displayTitle(spec, result.submissionId)} - ${kind === "answer" ? "教师版演示" : "学生版演示"}`,
      large: true,
    },
    { text: "模拟流程文件：不是正式教学资料，不含真实题面" },
    {
      text:
        result.mode === "practice"
          ? copyIndex === undefined
            ? `专项练习：共 ${copies} 次，每次 ${spec.count} 题，整册成品`
            : `专项练习：第 ${copyIndex} 次 / 共 ${copies} 次，每次 ${spec.count} 题`
          : `模式：${modeLabels[spec.mode]} 总题量：${result.totalCount ?? "附件待识别"}`,
    },
    { text: `模板：${spec.template} ${spec.templateVersion}` },
    { text: `要求：${spec.goal || "未填写"}` },
    { text: `结果：${result.id}` },
    { text: "题号与题组如下，仅用于核对本次配置和顺序：" },
  ];
  if (result.totalCount === null)
    lines.push({
      text: "附件尚未识别，不推断附件内母题数；以下仅为已选题库题结构。",
    });
  if (result.mode === "practice")
    lines.push({ text: "各次练习使用同一配置，实际不同题目尚未生成。" });
  for (const group of result.groups) {
    if (
      result.mode === "practice" &&
      copyIndex !== undefined &&
      (group.copyIndex ?? 1) !== copyIndex
    )
      continue;
    if (result.mode === "practice")
      lines.push({ text: `第 ${group.copyIndex ?? 1} 次练习` });
    if (result.mode === "variant")
      lines.push({ text: `第${group.sourceIndex}道母题（${group.sourceId}）` });
    for (const item of group.items) {
      lines.push({
        text: `${item.ordinal}. ${labels[item.kind]} ${item.index}：题面占位，尚未执行制作。`,
      });
      if (kind === "answer")
        lines.push({ text: "答案：模拟占位，尚未生成正式答案。", red: true });
      else
        lines.push({
          text: "________________________________________________________________",
        });
    }
  }
  return lines.flatMap((line) => {
    const chars = Array.from(line.text);
    const chunks: Line[] = [];
    for (let i = 0; i < chars.length; i += 36)
      chunks.push({ ...line, text: chars.slice(i, i + 36).join("") });
    return chunks;
  });
}
/** Minimal standalone PDF with CJK text. It describes a mock result, never a real question. */
export function buildDemoPdf(
  spec: DraftSpec,
  result: MockResult,
  kind: "student" | "answer",
): Uint8Array {
  const lines = demoLines(spec, result, kind);
  const pages: Line[][] = [];
  for (let i = 0; i < lines.length; i += 36) pages.push(lines.slice(i, i + 36));
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 6 + i * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );
  objects.push(
    "<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [4 0 R] >>",
  );
  objects.push(
    "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /FontDescriptor 5 0 R /DW 1000 >>",
  );
  objects.push(
    "<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 >>",
  );
  pages.forEach((page, index) => {
    const stream =
      page
        .map(
          (line, row) =>
            `BT /F1 ${line.large ? 15 : 11} Tf ${line.red ? "0.827 0.184 0.184" : "0.15 0.16 0.23"} rg 1 0 0 1 38 ${795 - row * 20} Tm <${unicodeHex(line.text)}> Tj ET`,
        )
        .join("\n") +
      `\nBT /F1 9 Tf 0.5 0.5 0.5 rg 1 0 0 1 250 30 Tm <${unicodeHex(`模拟演示 ${index + 1}/${pages.length}`)}> Tj ET`;
    const pageId = pageIds[index];
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`,
    );
    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
      .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Uint8Array.from(pdf, (ch) => ch.charCodeAt(0));
}
