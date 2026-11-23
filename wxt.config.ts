import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Gemini Context Meter',
    description: 'Локальная оценка заполненности контекстного окна в Gemini',
    permissions: ['storage'],
    host_permissions: ['https://gemini.google.com/*'],
  },
});