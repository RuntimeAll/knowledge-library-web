export interface PreviewDraft { title: string; includeAnswers: boolean }
export function validatePreview(draft: PreviewDraft): string | undefined {
  if (!draft.title.trim()) return '请填写预览标题';
  if (draft.title.trim().length > 60) return '标题最多 60 字';
}
export function describePreview(draft: PreviewDraft): string {
  return `${draft.title.trim()} · ${draft.includeAnswers ? '含红色答案' : '学生版'}`;
}
export function normalizeApiBase(value: string): string {
  const base = value.trim().replace(/\/+$/, '');
  if (!base) return '';
  if (base.startsWith('/') && !base.startsWith('//')) return base;
  if (!/^https?:\/\//i.test(base)) throw new Error('API 地址须为 HTTP(S) 或同源路径');
  const url = new URL(base);
  if (url.username || url.password || url.search || url.hash) throw new Error('API 地址不能含凭据、查询或片段');
  return base;
}
