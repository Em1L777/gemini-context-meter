export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  main() {
    console.log('[Gemini Context Meter] Content script загружен и работает!');
  },
});