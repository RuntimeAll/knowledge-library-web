<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, ref } from 'vue';
import type { FileRef } from '../../core/ports';
const selected = ref<FileRef>();
const error = ref('');
const input = ref<HTMLInputElement>();
let selectionVersion = 0;
// Render a native Web input: uni-app's generic input has no file type.
const NativeFileInput = defineComponent({
  setup: () => () => h('input', {
    ref: input, type: 'file', 'aria-label': '选择本机文件',
    accept: 'application/pdf,image/png,image/jpeg,image/gif', onChange: select,
  }),
});
const sampleUrl = `${import.meta.env.BASE_URL}static/preview-sample.pdf`;
const fileSize = computed(() => selected.value ? `${Math.max(1, Math.round(selected.value.size / 1024))} KB` : '');
function clear() {
  selectionVersion++;
  if (selected.value) URL.revokeObjectURL(selected.value.previewUrl);
  selected.value = undefined;
  if (input.value) input.value.value = '';
}
async function select(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  error.value = '';
  clear();
  const version = selectionVersion;
  if (file.size > 20 * 1024 * 1024) { error.value = '请选择 20 MB 以内的文件'; return; }
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (version !== selectionVersion) return;
  const pdf = String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  const image = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 || bytes[0] === 0xff && bytes[1] === 0xd8 || String.fromCharCode(...bytes.slice(0, 6)).startsWith('GIF8');
  if (!pdf && !image) { error.value = '请选择有效的 PDF、PNG、JPG 或 GIF 文件'; return; }
  selected.value = { name: file.name, size: file.size, kind: pdf ? 'pdf' : 'image', previewUrl: URL.createObjectURL(file) };
}
onBeforeUnmount(clear);
</script>
<template>
  <section class="files">
    <label class="drop-area">
      <span class="file-icon">＋</span><strong>选择一份本机文件</strong>
      <span>PDF / PNG / JPG / GIF · 最大 20 MB</span>
      <NativeFileInput />
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div v-if="selected" class="file-result">
      <div class="file-meta"><strong>{{ selected.name }}</strong><span>{{ fileSize }}</span><button aria-label="移除文件" @click="clear">移除</button></div>
      <iframe v-if="selected.kind === 'pdf'" :src="selected.previewUrl" title="本机 PDF 预览" />
      <img v-else :src="selected.previewUrl" alt="所选本机图片" />
      <a :href="selected.previewUrl" :download="selected.name">下载所选文件</a>
    </div>
    <div class="sample"><a :href="sampleUrl" target="_blank" rel="noopener">打开 PDF 示例 ↗</a><span>选择和预览仅在本机进行，文件不会上传。</span></div>
  </section>
</template>
<style scoped>
.files { display: flex; flex-direction: column; gap: 16px; }
.drop-area { position: relative; display: flex; align-items: center; flex-direction: column; gap: 12px; padding: 40px 16px; border: 1px dashed #b6d3cf; border-radius: 14px; background: #f7fbfa; cursor: pointer; text-align: center; }
.drop-area :deep(input) { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.drop-area:focus-within { outline: 2px solid var(--kb-brand); outline-offset: 3px; }
.drop-area strong { font-size: 15px; }
.drop-area span, .sample span { color: var(--kb-muted); font-size: 12px; }
.drop-area .file-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: #e3efed; color: var(--kb-brand); font-size: 28px; }
.file-meta { display: flex; gap: 12px; align-items: center; font-size: 12px; margin-bottom: 12px; }
.file-meta strong { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.file-meta button { background: none; border: none; color: #ad3a3a; cursor: pointer; }
iframe { width: 100%; height: 400px; border: 1px solid var(--kb-line); border-radius: 8px; }
img { max-width: 100%; max-height: 400px; object-fit: contain; display: block; margin: auto; }
a { color: var(--kb-brand); font-size: 12px; }
.sample { display: flex; flex-direction: column; gap: 12px; line-height: 1.7; }
.error { color: #b42318; font-size: 13px; }
</style>
