import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Gemini Context Meter',
    permissions: ['storage'],
    host_permissions: ['https://gemini.google.com/*'],
    icons: {
      "16": "icon-16.png",
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    },
    action: {
      default_icon: {
        "16": "icon-16.png",
        "32": "icon-32.png",
        "48": "icon-48.png",
        "128": "icon-128.png"
      }
    }
  },
});