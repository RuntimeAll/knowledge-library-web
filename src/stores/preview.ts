import { defineStore } from 'pinia';
export const usePreviewStore = defineStore('preview', {
  state: () => ({ title: '', includeAnswers: true, lastPreview: '' }),
});
